export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  level: number;
  experience_points: number;
  current_streak: number;
  last_workout_date: string;
  clan?: string;
  cursed_technique?: string;
}

export interface Exercise {
  id: string;
  name: string;
  name_en?: string;
  category: string;
  gif_url: string;
  tips: string[];
  is_custom: boolean;
  user_id?: string;
  media_blob?: Blob;
  runtime_media_url?: string;
  posicion_inicial?: string[];
  ejecucion?: string[];
  consejos?: string[];
  variantes?: string[];
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  day_of_week: number[]; // e.g. [1, 3, 5] (Monday, Wednesday, Friday)
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  default_sets: number;
  default_reps: number;
  default_rest_time: number; // in seconds
  is_time_based?: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  routine_id?: string;
  started_at: string;
  completed_at: string;
  experience_earned: number;
  synced: boolean;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rest_time: number; // in seconds
  is_completed: boolean;
  is_time_based?: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: 'profiles' | 'exercises' | 'routines' | 'routine_exercises' | 'workouts' | 'workout_sets';
  payload: any;
  timestamp: string;
}

// Persists the active workout session across app reloads/interruptions
export interface ActiveWorkoutState {
  id: 'current'; // singleton key
  routineId: string;
  routineName: string;
  exercises: any[];       // full exercise list for the session
  currentExerciseIndex: number;
  sets: Record<string, any[]>; // exerciseId -> set data
  startedAt: string;
  savedAt: string;
}

// Key-value store for local app settings (profile photo, username, etc.)
export interface AppSetting {
  key: string;
  value: any;
}

const DB_NAME = 'GymAppDB';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open local database');
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Create stores if they do not exist
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('exercises')) {
        db.createObjectStore('exercises', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('routines')) {
        db.createObjectStore('routines', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('routine_exercises')) {
        db.createObjectStore('routine_exercises', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        db.createObjectStore('workouts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workout_sets')) {
        db.createObjectStore('workout_sets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
      // v2: New stores for session resilience
      if (!db.objectStoreNames.contains('active_workout_state')) {
        db.createObjectStore('active_workout_state', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('app_settings')) {
        db.createObjectStore('app_settings', { keyPath: 'key' });
      }
    };
  });
}

// Generic helper to perform transactions
function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  return initDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

// Generic CRUD operations
export function addRecord<T>(storeName: string, record: T): Promise<void> {
  return getStore(storeName, 'readwrite').then((store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export function getRecord<T>(storeName: string, id: string): Promise<T | null> {
  return getStore(storeName, 'readonly').then((store) => {
    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export function getAllRecords<T>(storeName: string): Promise<T[]> {
  return getStore(storeName, 'readonly').then((store) => {
    return new Promise<T[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

export function deleteRecord(storeName: string, id: string): Promise<void> {
  return getStore(storeName, 'readwrite').then((store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Offline Sync Queue helpers
export async function queueSyncItem(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getAllRecords<SyncQueueItem>('sync_queue');
  if (queue.length >= 100) {
    console.warn('Sync queue limit reached (Circuit Breaker active). Prevented enqueuing to protect database from overflow.');
    throw new Error('La cola de sincronización sin conexión ha alcanzado su límite de seguridad de 100 elementos. Por favor, conéctate a internet para sincronizar tus avances antes de registrar más datos.');
  }

  const syncItem: SyncQueueItem = {
    ...item,
    id: generateUUID(),
    timestamp: new Date().toISOString(),
  };
  return addRecord('sync_queue', syncItem);
}

export function getSyncQueue(): Promise<SyncQueueItem[]> {
  return getAllRecords<SyncQueueItem>('sync_queue').then((items) => {
    // Sort chronologically by timestamp
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });
}

export function removeSyncQueueItem(id: string): Promise<void> {
  return deleteRecord('sync_queue', id);
}

export function clearAllTables(): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const stores = ['profiles', 'exercises', 'routines', 'routine_exercises', 'workouts', 'workout_sets', 'sync_queue'];
      const transaction = db.transaction(stores, 'readwrite');
      stores.forEach(store => {
        transaction.objectStore(store).clear();
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  });
}

// ─── Active Workout State (SPEC_007) ─────────────────────────────────────────
// Persists the workout session so it survives app reload, screen lock, or calls.

export async function saveActiveWorkoutState(state: Omit<ActiveWorkoutState, 'id' | 'savedAt'>): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('active_workout_state', 'readwrite');
    const record: ActiveWorkoutState = { ...state, id: 'current', savedAt: new Date().toISOString() };
    const req = tx.objectStore('active_workout_state').put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getActiveWorkoutState(): Promise<ActiveWorkoutState | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('active_workout_state', 'readonly');
    const req = tx.objectStore('active_workout_state').get('current');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearActiveWorkoutState(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('active_workout_state', 'readwrite');
    const req = tx.objectStore('active_workout_state').delete('current');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── App Settings — local-first profile/photo (SPEC_007) ─────────────────────
// Writes profile data to IndexedDB immediately. Supabase sync is async/secondary.

export async function setAppSetting(key: string, value: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('app_settings', 'readwrite');
    const req = tx.objectStore('app_settings').put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAppSetting<T = any>(key: string): Promise<T | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('app_settings', 'readonly');
    const req = tx.objectStore('app_settings').get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

