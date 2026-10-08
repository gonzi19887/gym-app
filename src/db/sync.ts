import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getAllRecords, deleteRecord, addRecord, getRecord, queueSyncItem, getSyncQueue } from './localDb';
import type { Profile, Exercise, Routine, Workout, RoutineExercise, WorkoutSet } from './localDb';

// Local-only fields that must never be sent to PostgREST (no column in the DB,
// or values that are not JSON-serializable such as Blobs).
const LOCAL_ONLY_FIELDS = ['runtime_media_url', 'media_blob'] as const;

// Errors that will never succeed no matter how many times we retry (schema drift:
// missing columns, unknown table, broken foreign key). Sending the same payload
// again would poison the FIFO queue forever, so the item must be discarded.
function isPermanentSyncError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === '42703' || code === '42P01' || code === 'PGRST204') return true;
  const message = (err as { message?: string })?.message || '';
  return /does not exist|not found in schema cache|schema cache/i.test(message);
}

// Extracts the offending column from a PostgREST 42703 error
// ("column workout_sets.is_time_based does not exist").
function missingColumnOf(err: unknown): string | null {
  const message = (err as { message?: string })?.message || '';
  const match = message.match(/column \w+\.(\w+) does not exist/i) || message.match(/column "(\w+)" does not exist/i);
  return match ? match[1] : null;
}

// Upserts, and if the column does not exist in the cloud schema (drift), drops
// that single field and retries once — data is preserved minus the unknown
// column instead of blocking/discarding the whole queue item.
async function upsertResilient(
  table: string,
  payload: Record<string, unknown>
): Promise<{ error: unknown; droppedColumns: string[] }> {
  const droppedColumns: string[] = [];
  const current = { ...payload };

  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase!.from(table).upsert(current);
    if (!error) return { error: null, droppedColumns };

    const missing = missingColumnOf(error);
    if (!missing || !(missing in current)) {
      return { error, droppedColumns };
    }
    console.warn(`Schema drift: column "${table}.${missing}" missing in cloud — dropping it from payload.`);
    delete current[missing];
    droppedColumns.push(missing);
  }
  return { error: new Error('Too many missing columns'), droppedColumns };
}

// Strip local-only fields before upserting.
function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const tablePayload = { ...payload };
  for (const field of LOCAL_ONLY_FIELDS) {
    if (field in tablePayload) delete tablePayload[field];
  }
  return tablePayload;
}

// Sync local queue to Supabase
export async function syncLocalQueueToCloud(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Use chronologically sorted queue from outbox
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} items to Supabase (Outbox Pattern)...`);

    for (const item of queue) {
      try {
        const { tableName, action, payload, id } = item;

        if (action === 'CREATE' || action === 'UPDATE') {
          const tablePayload = sanitizePayload(payload);

          // Enforce current user ID
          if (tableName === 'profiles') {
            tablePayload.id = session.user.id;
            if (tablePayload.last_workout_date === '') {
              tablePayload.last_workout_date = null;
            }
          } else if ('user_id' in tablePayload && tableName !== 'exercises') {
            tablePayload.user_id = session.user.id;
          } else if (tableName === 'exercises' && tablePayload.is_custom) {
            tablePayload.user_id = session.user.id;
          }

          const { error } = await upsertResilient(tableName, tablePayload);

          if (error) throw error;
        } else if (action === 'DELETE') {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', payload.id);

          if (error) throw error;
        }

        // Remove item from local queue after successful sync
        await deleteRecord('sync_queue', id);
      } catch (err) {
        if (isPermanentSyncError(err)) {
          // Schema drift: this payload can never be uploaded. Discard it so it
          // does not block the rest of the queue (workouts, sets, etc.).
          console.error('Discarding unsyncable item (permanent schema error):', item, err);
          await deleteRecord('sync_queue', item.id);
          continue;
        }
        console.error('Failed to sync item:', item, err);
        // Break out of the loop on connection or other error to preserve order of operations (FIFO queue)
        break;
      }
    }
  } catch (err) {
    console.error('Sync process error:', err);
  }
}

// Sync a specific table's local queue items to Supabase
export async function syncTableToCloud(tableName: 'profiles' | 'exercises' | 'routines' | 'routine_exercises' | 'workouts' | 'workout_sets'): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Use chronologically sorted queue
    const queue = await getSyncQueue();
    const items = queue.filter(item => item.tableName === tableName);
    if (items.length === 0) return;

    console.log(`Syncing ${items.length} items of table ${tableName} to Supabase...`);

    for (const item of items) {
      const { action, payload, id } = item;

      try {
        if (action === 'CREATE' || action === 'UPDATE') {
          const tablePayload = sanitizePayload(payload);

          if (tableName === 'profiles') {
            tablePayload.id = session.user.id;
            if (tablePayload.last_workout_date === '') {
              tablePayload.last_workout_date = null;
            }
          } else if ('user_id' in tablePayload && tableName !== 'exercises') {
            tablePayload.user_id = session.user.id;
          } else if (tableName === 'exercises' && tablePayload.is_custom) {
            tablePayload.user_id = session.user.id;
          }

          const { error } = await upsertResilient(tableName, tablePayload);

          if (error) throw error;
        } else if (action === 'DELETE') {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', payload.id);

          if (error) throw error;
        }

        await deleteRecord('sync_queue', id);
      } catch (err) {
        if (isPermanentSyncError(err)) {
          // Discard payload that can never be uploaded instead of blocking this
          // table's queue forever (FIFO: nothing behind it would ever sync).
          console.error('Discarding unsyncable item (permanent schema error):', item, err);
          await deleteRecord('sync_queue', id);
          continue;
        }
        console.error(`Sync table ${tableName} error:`, err);
        throw err;
      }
    }
  } catch (err) {
    console.error(`Sync table ${tableName} error:`, err);
    throw err;
  }
}

// Pull cloud database entries to local IndexedDB (ran upon logging in)
export async function pullCloudDataToLocal(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const tables = ['profiles', 'exercises', 'routines', 'routine_exercises', 'workouts', 'workout_sets'] as const;
    const queue = await getSyncQueue();

    for (const table of tables) {
      try {
        // Collect IDs that are pending local sync to avoid overwriting them
        const pendingIds = new Set(
          queue.filter(item => item.tableName === table).map(item => item.payload.id)
        );

        let query = supabase.from(table).select('*');
        
        if (table === 'profiles') {
          query = query.eq('id', session.user.id);
        } else if (table === 'exercises') {
          query = query.or(`user_id.eq.${session.user.id},user_id.is.null`);
        } else if (table === 'routines' || table === 'workouts') {
          query = query.eq('user_id', session.user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          for (const row of data) {
            // Local-first: if this record is currently pending synchronization in the outbox, skip pulling it
            if (pendingIds.has(row.id)) {
              console.log(`Outbox protection: skipped pulling record ${row.id} of table ${table} to protect local modifications.`);
              continue;
            }
            await addRecord(table, row);
          }
        }
      } catch (err) {
        console.error(`Failed to pull table ${table}:`, err);
      }
    }
  } catch (err) {
    console.error('Pull data error:', err);
  }
}

// Pull a specific table from cloud to local IndexedDB (used for per-step login sync overlay)
export async function pullTableFromCloud(
  tableName: 'profiles' | 'exercises' | 'routines' | 'routine_exercises' | 'workouts' | 'workout_sets'
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const queue = await getSyncQueue();
  const pendingIds = new Set(
    queue.filter(item => item.tableName === tableName).map(item => item.payload.id)
  );

  let query = supabase.from(tableName).select('*');

  if (tableName === 'profiles') {
    query = query.eq('id', session.user.id);
  } else if (tableName === 'exercises') {
    query = query.or(`user_id.eq.${session.user.id},user_id.is.null`);
  } else if (tableName === 'routines' || tableName === 'workouts') {
    query = query.eq('user_id', session.user.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (data && data.length > 0) {
    for (const row of data) {
      if (pendingIds.has(row.id)) {
        console.log(`Outbox protection: skipped pulling record ${row.id} of table ${tableName} to protect local modifications.`);
        continue;
      }
      await addRecord(tableName, row);
    }
  }
}

// Migrate guest data to authenticated user
export async function migrateGuestDataToUser(newUserId: string): Promise<void> {
  // 1. Profile Migration
  const guestProfile = await getRecord<Profile>('profiles', 'user-default-id');
  if (guestProfile) {
    // Delete old profile
    await deleteRecord('profiles', 'user-default-id');
    // Save new profile
    const newProfile = {
      ...guestProfile,
      id: newUserId,
    };
    await addRecord('profiles', newProfile);
    await queueSyncItem({
      action: 'CREATE',
      tableName: 'profiles',
      payload: newProfile
    });
  }

  // 2. Routines Migration
  const routines = await getAllRecords<Routine>('routines');
  const migratedRoutineIds = new Set<string>();
  for (const routine of routines) {
    if (routine.user_id === 'user-default-id') {
      migratedRoutineIds.add(routine.id);
      const updatedRoutine = { ...routine, user_id: newUserId };
      await addRecord('routines', updatedRoutine);
      await queueSyncItem({
        action: 'CREATE',
        tableName: 'routines',
        payload: updatedRoutine
      });
    }
  }

  // 3. Routine Exercises Migration
  if (migratedRoutineIds.size > 0) {
    const routineExercises = await getAllRecords<RoutineExercise>('routine_exercises');
    for (const re of routineExercises) {
      if (migratedRoutineIds.has(re.routine_id)) {
        await queueSyncItem({
          action: 'CREATE',
          tableName: 'routine_exercises',
          payload: re
        });
      }
    }
  }

  // 4. Workouts Migration
  const workouts = await getAllRecords<Workout>('workouts');
  const migratedWorkoutIds = new Set<string>();
  for (const workout of workouts) {
    if (workout.user_id === 'user-default-id') {
      migratedWorkoutIds.add(workout.id);
      const updatedWorkout = { ...workout, user_id: newUserId };
      await addRecord('workouts', updatedWorkout);
      await queueSyncItem({
        action: 'CREATE',
        tableName: 'workouts',
        payload: updatedWorkout
      });
    }
  }

  // 5. Workout Sets Migration
  if (migratedWorkoutIds.size > 0) {
    const sets = await getAllRecords<WorkoutSet>('workout_sets');
    for (const set of sets) {
      if (migratedWorkoutIds.has(set.workout_id)) {
        await queueSyncItem({
          action: 'CREATE',
          tableName: 'workout_sets',
          payload: set
        });
      }
    }
  }

  // 6. Custom Exercises Migration
  const exercises = await getAllRecords<Exercise>('exercises');
  for (const exercise of exercises) {
    if (exercise.is_custom && exercise.user_id === 'user-default-id') {
      const updatedExercise = { ...exercise, user_id: newUserId };
      await addRecord('exercises', updatedExercise);
      await queueSyncItem({
        action: 'CREATE',
        tableName: 'exercises',
        payload: updatedExercise
      });
    }
  }
}
