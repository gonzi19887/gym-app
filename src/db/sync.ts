import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getAllRecords, deleteRecord, addRecord } from './localDb';
import type { SyncQueueItem } from './localDb';

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
          // If we are pulling routine_exercises or workout_sets, filter them locally or join,
          // but for general pulling, we can just save them to the local store
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
