# AppGimnasio · Capsule Corp Fitness

PWA de seguimiento de rutinas de gimnasio, **offline-first**, con gamificación de
Ki, niveles y la recompensa de las 7 esferas (Shenron). Tema de diseño **Chronos
Gen 2 / Capsule Corp** (ámbar `#f4a261` + cian `#6fd8c8` sobre fondo `#10131e`).

- **Producción:** https://gym-app-ten-lovat.vercel.app
- **Repo:** `gonzi19887/gym-app` · ramas `dev` (trabajo) → `main` (producción)

---

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| UI | React 19.2 + TypeScript 6 + Vite 8 (rolldown) |
| Estilos | Tailwind CSS v3.4 (compilado) + `src/index.css` (tokens y componentes) |
| Iconos | Lucide React + Material Symbols |
| Datos | **IndexedDB local** (`src/db/localDb.ts`) como fuente de verdad offline + **Supabase** (Postgres + RLS) para sync y multi-dispositivo |
| PWA | `vite-plugin-pwa` 1.3 (Workbox, precache + autoUpdate) |
| Sonido | Web Audio API (bips de cronómetro/serie), sin dependencias |

## 📁 Estructura

```
src/
  App.tsx              # pantallas y navegación (5 tabs: Hoy, Calendario, Rutinas, Progreso, Perfil)
  index.css            # TOKENS (tema oscuro/claro) + componentes CSS
  components/          # CalendarKi, ShenronRewardModal, DragonBallStreak, MaterialButton…
  db/
    localDb.ts         # IndexedDB + outbox de sync (6 tablas)
    sync.ts            # motor de sincronización (FIFO, tolerante a deriva de esquema)
    seed.ts            # siembra el catálogo (versionada con CURRENT_SEED_VERSION)
    scraped_exercises_es.json   # catálogo: 1285 ejercicios en español
    supabaseClient.ts  # cliente Supabase
docs/                 # documentación técnica (índice abajo)
public/images/<GRUPO>/ # GIFs de los ejercicios, en kebab-case
```

## 🎨 Reglas de color (importante)

Hay **dos capas** y ambas deben ir **por variables CSS**:

1. `src/index.css` — tokens `--bg-*`, `--text-*`, `--accent-*`, `--surface-*`:
   cambian con `data-theme` (dark/light).
2. `tailwind.config.js` — los 51 tokens de la paleta Stitch están mapeados a
   `var(--tw-*)`; **no añadas hex sueltos aquí**. Los que llevan opacidad
   (`primary`, `on-surface-variant`, `error`) usan
   `rgb(var(--tw-x) / <alpha-value>)` para que `/5`, `/10`, `/20` funcionen.

Texto sobre acentos → **`var(--on-accent)`** (oscuro `#10131e`, claro `#ffffff`).
En oscuro, texto blanco sobre ámbar daba 2,1:1 (no AA).

> Hasta 2026-10-20 la paleta de Tailwind estaba fija en hex oscuros mientras las
> variables CSS sí seguían al tema: en modo claro las pantallas Stitch quedaban
> oscuras dentro de una app clara, con texto claro sobre tarjeta clara. Si
> reintroduces un color literal, vuelve el problema.

## 🗓️ Regla de fechas

Toda clave de día se calcula en **hora local** (`toLocalDateStr`). `toISOString()`
es UTC y en España (UTC+2) devuelve el día anterior: fue la causa del desfase
del calendario (el "hoy" caía en mañana) y del error de sincronización por FK.

## 🏋️ Catálogo de ejercicios

`src/db/scraped_exercises_es.json` → 1285 ejercicios con **id determinista**
(hash del slug, mismo algoritmo que `src/db/seed.ts`:
`${hex}-c0de-4e80-babe-${hex}`) para que IndexedDB y Supabase coincidan.

**Añadir un ejercicio** (los 5 pasos, en orden):

1. Añadir la entrada al JSON (`name_es`, `name_en`, `category`, `local_gif_path`,
   `instructions_es`, `posicion_inicial`, `ejecucion`, `consejos`, `mistakes_es`).
2. Subir `CURRENT_SEED_VERSION` en `src/db/seed.ts` para forzar el re-seed
   (los ejercicios personalizados del usuario se conservan).
3. Poner el GIF en `public/images/<GRUPO>/<nombre-kebab>.gif`.
4. **Subirlo a Supabase** con el script de service role (la app **no puede**:
   la política RLS de `exercises` solo permite insertar con `user_id = auth.uid()`
   y el catálogo va con `user_id = NULL`).
5. Si el GIF es **nuevo**, añadirlo a la lista `EXTRA` del script de despliegue
   (excluye `public/images/` de la comparación normal).

> Omitir el paso 4 provoca un `23503` (violación de FK) al sincronizar la
> rutina que lo referencia. El motor de sync ya no bloquea la cola por eso
> (deja la fila pendiente y reintenta), pero el dato no sube.

## 🔄 Sincronización

Outbox FIFO en IndexedDB → `src/db/sync.ts` → Supabase. 6 tablas:
`profiles`, `exercises`, `routines`, `routine_exercises`, `workouts`,
`workout_sets`.

- `isPermanentSyncError` descarta lo irrecuperable (deriva de esquema) para no
  envenenar la cola.
- Un `23503` (FK) **no** se descarta ni bloquea: la fila queda pendiente y se
  reintenta en la siguiente pasada.
- El catálogo se sincroniza por **service role** (script aparte), no desde la app.

## 🛠️ Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

## 🚀 Despliegue

El pipeline vive fuera del repo (en la máquina del agente, `plan/`): push a `dev`
vía GitHub API → merge a `main` → espera del build en Vercel → verificación del
bundle en producción. Detalle y gotchas en el vault, en
`PROYECTOS/Gym App Jujutsu Kaisen PWA/contexto_mañana.md`.

## 📚 Documentación (`docs/`)

| Documento | Contenido |
|---|---|
| `AppGimnasio_Design_System_Stitch.md` | Sistema de diseño Chronos Gen 2: tokens, tipografía, componentes y reglas |
| `AppGimnasio_Base_Datos_y_Seguridad.md` | Esquema de Supabase, RLS, claves y modelo de seguridad |
| `AppGimnasio_Arquitectura_Offline.md` | Offline-first: IndexedDB, outbox, circuit breaker, PWA |
| `AppGimnasio_Tutorial_NotebookLM.md` | Tutorial de uso y de integración con NotebookLM |
| `AppGimnasio_Enlaces_Acceso.md` | Enlaces de acceso a la app y a las herramientas |
| `Informe_Seguridad_AppGimnasio.md` | Auditoría de seguridad: aislamiento de claves, bundle público, RLS |

La capa de negocio y uso (fórmulas de 1RM, gamificación, SDDs, informes y bitácora
de cambios) vive en el vault: `PROYECTOS/Gym App Jujutsu Kaisen PWA/`.
