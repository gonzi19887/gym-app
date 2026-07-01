# Especificación de la Base de Datos y Políticas de Seguridad (Supabase & RLS)

Este documento detalla el esquema relacional de la base de datos PostgreSQL alojada en **Supabase** para **AppGimnasio**, incluyendo la estructura de tablas, tipos de datos, relaciones de claves foráneas y las reglas de seguridad basadas en políticas RLS (Row Level Security).

---

## 🗺️ Modelo Entidad-Relación y Tablas

### 1. Tabla: `profiles`
Almacena el perfil del hechicero, su nivel, experiencia y racha. El ID coincide uno a uno con la tabla interna de autenticación de Supabase (`auth.users`).

| Columna | Tipo de Datos | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `REFERENCES auth.users` | ID del usuario autenticado. |
| `username` | `text` | `NOT NULL` | Nombre público del hechicero. |
| `avatar_url` | `text` | `NULL` | Enlace a la imagen del avatar o foto capturada. |
| `created_at` | `timestamp` | `timezone('utc'::text, now())` | Fecha de creación del perfil. |
| `level` | `integer` | `DEFAULT 1 NOT NULL` | Nivel actual de rango de hechicero. |
| `experience_points`| `integer` | `DEFAULT 0 NOT NULL` | Energía maldita acumulada. |
| `current_streak` | `integer` | `DEFAULT 0 NOT NULL` | Voto vinculante (días entrenados seguidos). |
| `last_workout_date`| `date` | `NULL` | Última fecha en que se registró ejercicio. |
| `clan` | `text` | `NULL` | Clan mágico del usuario (ej. Gojo). |
| `cursed_technique` | `text` | `NULL` | Nombre de la técnica maldita. |

---

### 2. Tabla: `exercises`
Almacena el catálogo de ejercicios. Incluye los 1284 ejercicios globales precargados y los ejercicios personalizados añadidos por cada usuario.

| Columna | Tipo de Datos | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | ID del ejercicio. |
| `name` | `text` | `NOT NULL` | Nombre del ejercicio en español. |
| `category` | `text` | `NOT NULL` | Grupo muscular (ej. Piernas, Pecho). |
| `gif_url` | `text` | `NULL` | URL del GIF demostrativo en local/cloud. |
| `tips` | `text[]` | `DEFAULT '{}'::text[] NOT NULL` | Consejos paso a paso de técnica maldita. |
| `is_custom` | `boolean` | `DEFAULT false NOT NULL` | `true` si es creado por el usuario. |
| `user_id` | `uuid` | `REFERENCES profiles(id)` | Propietario (nulo para catálogo global). |

---

### 3. Tabla: `routines`
Almacena las rutinas de entrenamiento estructuradas por el hechicero.

| Columna | Tipo de Datos | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | ID de la rutina. |
| `user_id` | `uuid` | `REFERENCES profiles(id) ON DELETE CASCADE` | Creador de la rutina. |
| `name` | `text` | `NOT NULL` | Nombre descriptivo de la rutina. |
| `day_of_week` | `integer[]` | `DEFAULT '{}'::integer[] NOT NULL` | Días programados (0=Domingo, 1=Lunes). |
| `created_at` | `timestamp` | `timezone('utc')` | Fecha de creación. |

---

### 4. Tabla: `routine_exercises`
Tabla intermedia que define los ejercicios asignados a una rutina y sus parámetros por defecto.

| Columna | Tipo de Datos | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | ID único de la relación. |
| `routine_id` | `uuid` | `REFERENCES routines(id) ON DELETE CASCADE` | ID de la rutina asociada. |
| `exercise_id` | `uuid` | `REFERENCES exercises(id) ON DELETE CASCADE` | ID del ejercicio asociado. |
| `order_index` | `integer` | `NOT NULL` | Orden de ejecución en la rutina. |
| `default_sets` | `integer` | `DEFAULT 3 NOT NULL` | Cantidad de series sugeridas por defecto. |
| `default_reps` | `integer` | `DEFAULT 10 NOT NULL` | Repeticiones por defecto. |
| `default_rest_time`| `integer` | `DEFAULT 60 NOT NULL` | Segundos de descanso por defecto. |

---

### 5. Tabla: `workouts`
Almacena las sesiones de entrenamiento finalizadas (misiones de purificación completadas).

| Columna | Tipo de Datos | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | ID de la sesión. |
| `user_id` | `uuid` | `REFERENCES profiles(id) ON DELETE CASCADE` | Usuario que entrenó. |
| `routine_id` | `uuid` | `REFERENCES routines(id) ON DELETE SET NULL`| Rutina base (opcional). |
| `started_at` | `timestamp` | `NOT NULL` | Fecha y hora de inicio de la misión. |
| `completed_at` | `timestamp` | `NOT NULL` | Fecha y hora de finalización. |
| `experience_earned`| `integer` | `DEFAULT 0 NOT NULL` | Energía maldita obtenida en esta sesión. |
| `synced` | `boolean` | `DEFAULT true NOT NULL` | Estado de sincronización en la nube. |

---

### 6. Tabla: `workout_sets`
Almacena los datos de cada serie (set) completada durante un entrenamiento.

| Columna | Tipo de Datos | Restricciones / Default | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | ID de la serie. |
| `workout_id` | `uuid` | `REFERENCES workouts(id) ON DELETE CASCADE` | Sesión a la que pertenece. |
| `exercise_id` | `uuid` | `REFERENCES exercises(id) ON DELETE CASCADE` | Ejercicio realizado. |
| `set_number` | `integer` | `NOT NULL` | Número de la serie (1, 2, 3, etc.). |
| `weight` | `numeric` | `NOT NULL` | Peso levantado en kg. |
| `reps` | `integer` | `NOT NULL` | Repeticiones realizadas. |
| `rest_time` | `integer` | `NOT NULL` | Tiempo de descanso asignado en segundos. |
| `is_completed` | `boolean` | `DEFAULT false NOT NULL` | `true` si la serie fue completada. |

---

## 🔒 Seguridad de Acceso: Row Level Security (RLS)

La base de datos cuenta con políticas estrictas de RLS para garantizar que los usuarios solo puedan interactuar con sus propios datos privados, impidiendo la lectura o modificación no autorizada de entrenamientos y rutinas de otros chamanes.

### Políticas por Tabla:

#### 1. Tabla `profiles`
- **Lectura**: Cualquier usuario puede ver perfiles públicos (necesario para rankings de Energía Maldita).
- **Escritura e Inserción**: Solo el usuario autenticado cuyo `id` coincida con el del perfil (`auth.uid() = id`) puede registrarse o editar sus datos.

#### 2. Tabla `exercises`
- **Lectura**: Cualquier usuario autenticado puede leer ejercicios con `user_id IS NULL` (catálogo global de 1284 ejercicios) o ejercicios creados por él mismo (`auth.uid() = user_id`).
- **Inserción**: Solo se permite crear ejercicios si el `user_id` del registro coincide con la sesión del usuario.

#### 3. Tablas `routines` y `routine_exercises`
- **Acceso Completo (Select/Insert/Update/Delete)**: Solo permitido si el `user_id` de la rutina coincide con el del usuario autenticado (`auth.uid() = user_id`).

#### 4. Tablas `workouts` y `workout_sets`
- **Acceso Completo**: Restringido exclusivamente al propietario de las sesiones de entrenamiento completadas (`auth.uid() = user_id`).
