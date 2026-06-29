import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getAllRecords, deleteRecord, addRecord, getRecord, queueSyncItem } from './localDb';
import type { SyncQueueItem, Profile, Exercise, Routine, Workout, RoutineExercise, WorkoutSet } from './localDb';

// Sync local queue to Supabase
export async function syncLocalQueueToCloud(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const queue = await getAllRecords<SyncQueueItem>('sync_queue');
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} items to Supabase...`);

    for (const item of queue) {
      try {
        const { tableName, action, payload, id } = item;

        if (action === 'CREATE' || action === 'UPDATE') {
          const tablePayload = { ...payload };
          
          // Clean up runtime fields that don't belong in the DB
          if ('runtime_media_url' in tablePayload) {
            delete tablePayload.runtime_media_url;
          }

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

          const { error } = await supabase
            .from(tableName)
            .upsert(tablePayload);

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
        console.error('Failed to sync item:', item, err);
        // Break out of the loop on connection or other error to preserve order of operations
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

    const queue = await getAllRecords<SyncQueueItem>('sync_queue');
    const items = queue.filter(item => item.tableName === tableName);
    if (items.length === 0) return;

    console.log(`Syncing ${items.length} items of table ${tableName} to Supabase...`);

    for (const item of items) {
      const { action, payload, id } = item;

      if (action === 'CREATE' || action === 'UPDATE') {
        const tablePayload = { ...payload };
        
        if ('runtime_media_url' in tablePayload) {
          delete tablePayload.runtime_media_url;
        }

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

        const { error } = await supabase
          .from(tableName)
          .upsert(tablePayload);

        if (error) throw error;
      } else if (action === 'DELETE') {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', payload.id);

        if (error) throw error;
      }

      await deleteRecord('sync_queue', id);
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

    for (const table of tables) {
      try {
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
