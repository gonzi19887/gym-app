-- MIGRACIÓN 2026-10-07 — Fix Bug 3 (historial perdido)
-- Ejecutar en el SQL Editor de Supabase (proyecto qitboisspvnfbazvndnq).
--
-- CAUSA RAÍZ: la app envía columnas que NO existen en la nube:
--   routine_exercises.is_time_based, workout_sets.is_time_based, exercises.name_en...
-- PostgREST rechaza el upsert con error 42703 y syncLocalQueueToCloud hacía
-- `break` → TODA la cola FIFO se bloqueaba → los workouts nunca se subían →
-- al limpiar la caché del navegador el historial local desaparecía sin respaldo.
--
-- La app ya no se bloquea por esto (sync.ts descarta/reintenta sin la columna),
-- pero esta migración evita perder los campos is_time_based/name_en.

-- 1. Series con base de tiempo (cronómetro) por serie
alter table public.routine_exercises
  add column if not exists is_time_based boolean not null default false;

alter table public.workout_sets
  add column if not exists is_time_based boolean not null default false;

-- 2. Nombre en inglés del ejercicio (seed bilingüe)
alter table public.exercises
  add column if not exists name_en text;

-- 3. Contenido educativo del seed (opcional pero usado por la app)
alter table public.exercises
  add column if not exists posicion_inicial text[] not null default '{}',
  add column if not exists ejecucion text[] not null default '{}',
  add column if not exists consejos text[] not null default '{}',
  add column if not exists variantes text[] not null default '{}';

-- Verificación
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (column_name = 'is_time_based' or column_name = 'name_en')
order by table_name, column_name;
