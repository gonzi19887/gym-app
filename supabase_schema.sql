-- TABLAS DE LA BASE DE DATOS DE GYM APP
-- Copia y pega esto en el editor SQL de Supabase (SQL Editor)

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. Tabla: profiles
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text not null,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    level integer default 1 not null,
    experience_points integer default 0 not null,
    current_streak integer default 0 not null,
    last_workout_date date,
    clan text,
    cursed_technique text
);

-- 2. Tabla: exercises
create table public.exercises (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null,
    gif_url text,
    tips text[] default '{}'::text[] not null,
    is_custom boolean default false not null,
    user_id uuid references public.profiles(id) on delete cascade
);

-- 3. Tabla: routines
create table public.routines (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    day_of_week integer[] default '{}'::integer[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla: routine_exercises
create table public.routine_exercises (
    id uuid primary key default gen_random_uuid(),
    routine_id uuid references public.routines(id) on delete cascade not null,
    exercise_id uuid references public.exercises(id) on delete cascade not null,
    order_index integer not null,
    default_sets integer default 3 not null,
    default_reps integer default 10 not null,
    default_rest_time integer default 60 not null
);

-- 5. Tabla: workouts
create table public.workouts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    routine_id uuid references public.routines(id) on delete set null,
    started_at timestamp with time zone not null,
    completed_at timestamp with time zone not null,
    experience_earned integer default 0 not null,
    synced boolean default true not null
);

-- 6. Tabla: workout_sets
create table public.workout_sets (
    id uuid primary key default gen_random_uuid(),
    workout_id uuid references public.workouts(id) on delete cascade not null,
    exercise_id uuid references public.exercises(id) on delete cascade not null,
    set_number integer not null,
    weight numeric not null,
    reps integer not null,
    rest_time integer not null,
    is_completed boolean default false not null
);

-- CONFIGURAR ROW LEVEL SECURITY (RLS) - SEGURIDAD

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

-- Políticas de perfiles
create policy "Cualquiera puede leer perfiles" on public.profiles
    for select using (true);

create policy "El usuario puede actualizar su propio perfil" on public.profiles
    for update using (auth.uid() = id);

create policy "El usuario puede insertar su propio perfil" on public.profiles
    for insert with check (auth.uid() = id);

-- Políticas de ejercicios
create policy "Cualquiera puede leer ejercicios globales y propios" on public.exercises
    for select using (user_id is null or auth.uid() = user_id);

create policy "El usuario puede insertar sus propios ejercicios" on public.exercises
    for insert with check (auth.uid() = user_id);

create policy "El usuario puede actualizar/borrar sus propios ejercicios" on public.exercises
    for all using (auth.uid() = user_id);

-- Políticas de rutinas
create policy "El usuario puede ver sus propias rutinas" on public.routines
    for select using (auth.uid() = user_id);

create policy "El usuario puede modificar sus propias rutinas" on public.routines
    for all using (auth.uid() = user_id);

-- Políticas de ejercicios de rutinas
create policy "El usuario puede ver ejercicios de sus rutinas" on public.routine_exercises
    for select using (
        exists (
            select 1 from public.routines
            where public.routines.id = routine_id and public.routines.user_id = auth.uid()
        )
    );

create policy "El usuario puede modificar ejercicios de sus rutinas" on public.routine_exercises
    for all using (
        exists (
            select 1 from public.routines
            where public.routines.id = routine_id and public.routines.user_id = auth.uid()
        )
    );

-- Políticas de entrenamientos
create policy "El usuario puede ver sus entrenamientos" on public.workouts
    for select using (auth.uid() = user_id);

create policy "El usuario puede modificar sus entrenamientos" on public.workouts
    for all using (auth.uid() = user_id);

-- Políticas de series de entrenamientos
create policy "El usuario puede ver series de sus entrenamientos" on public.workout_sets
    for select using (
        exists (
            select 1 from public.workouts
            where public.workouts.id = workout_id and public.workouts.user_id = auth.uid()
        )
    );

create policy "El usuario puede modificar series de sus entrenamientos" on public.workout_sets
    for all using (
        exists (
            select 1 from public.workouts
            where public.workouts.id = workout_id and public.workouts.user_id = auth.uid()
        )
    );

-- TRIGGER PARA CREAR PERFIL AUTOMÁTICO AL REGISTRARSE
-- Cuando un usuario se registra en Supabase Auth, se crea su fila en public.profiles automáticamente

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, level, experience_points, current_streak)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Chamán Novato'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=150&auto=format&fit=crop'
    ),
    1,
    0,
    0
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Índices para Optimización de Consultas (Supabase Best Practices)
create index if not exists idx_routine_exercises_routine_id on public.routine_exercises(routine_id);
create index if not exists idx_routine_exercises_exercise_id on public.routine_exercises(exercise_id);
create index if not exists idx_workouts_user_id on public.workouts(user_id);
create index if not exists idx_workout_sets_workout_id on public.workout_sets(workout_id);
create index if not exists idx_workout_sets_exercise_id on public.workout_sets(exercise_id);
