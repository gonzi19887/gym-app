---
id: SPEC_014
title: Code Quality — Ponytail Audit + Atomic Design Components
status: active
priority: medium
branch: dev
created: 2026-07-04
updated: 2026-10-07
linear_id: 561d785d-6da7-4c1e-934f-84a8a76e5ffa
linear_key: GON-90
---

## 🎯 Objetivo
Modularizar el archivo monolítico `App.tsx` (más de 216 KB y 4,700+ líneas) en un árbol de componentes atómicos mantenible y limpio, eliminar código muerto de temáticas pasadas y optimizar el rendimiento de renderización (FCP/LCP) mediante el ponytail audit.

## 📐 Alcance

### ✅ Arquitectura Atómica
- **Átomos**: Componentes base reutilizables (`Button`, `Badge`, `Stepper`, `TimerCircle`, `Input`).
- **Moléculas**: Uniones de átomos (`SetRow`, `ExerciseCard` con cargador progresivo de GIFs, `WaterWidget`).
- **Organismos**: Paneles complejos (`WorkoutSessionPanel`, `RoutineBuilderFlat`, `CalendarMonthGrid`).
- **Páginas**: Componentes contenedores principales (`HoyTab`, `RutinasTab`, `CalendarioTab`, `PerfilTab`, `OnboardingWizard`).

### ✅ Ponytail Audit (Limpieza y Simplicidad)
- **Eliminar código muerto**: Retirar todos los residuos y estilos de la temática de Jujutsu Kaisen que no fueron limpiados.
- **Evitar dependencias pesadas**: Diseñar componentes nativos (como los gráficos de perfil utilizando SVG plano) en lugar de instalar librerías externas de visualización.
- **Rendimiento**: Memorizar listados de ejercicios con `useMemo` y componentes propensos a re-renders con `memo` o `useCallback`.

## 🔧 Requisitos Técnicos
- **Archivos**: `src/components/`, `src/App.tsx`, `src/index.css`
- **Tamaño máximo**: Ningún archivo extraído debe superar las **500 líneas de código**.

## 📋 Tareas
- [ ] 1. Identificar y auditar código muerto de la temática JJK.
- [ ] 2. Configurar la estructura de carpetas en `src/components/` (atoms, molecules, organisms, pages).
- [ ] 3. Extraer y probar los componentes del nivel Átomo.
- [ ] 4. Extraer las Moléculas (ej. `ExerciseCard` con pre-caching de GIFs).
- [ ] 5. Extraer los Organismos y las Páginas de los Tabs.
- [ ] 6. Refactorizar `App.tsx` para que actúe exclusivamente como el router de estado y proveedor de base de datos.
- [ ] 7. Ejecutar `npm run build` y optimizar la carga FCP.

### ➕ Añadidas 2026-10-07 (SDD análisis externo — decisión Q3-a: lo seguro se arregla ya, lo riesgoso queda aquí)

- [ ] 8. Refactorizar los **4 `react-hooks/set-state-in-effect`** de `src/App.tsx` (líneas aproximadas del informe `plan\lint_report_2026-10-07.txt`):
  - ~412 `setOnboardingAvatarUrl` (efecto de `editAvatarUrl`) — bajo riesgo.
  - ~419 `setNewRoutineName('')` (efecto de `showRoutineCreator`) — bajo riesgo.
  - ~1291 `setExerciseTimeElapsed(0)` (reset al cambiar de ejercicio) — ⚠️ **toca el fix de timers 2026-10-06**.
  - ~1363 `setPendingTimers(null)` (restauración de timers tras recarga) — ⚠️ **toca el fix de timers 2026-10-06**.
  Patrón recomendado (react.dev "You Might Not Need an Effect"): derivar estado
  durante el render comparando con el estado previo, o mover la lógica al event
  handler. **Tras tocar los dos últimos: prueba manual obligatoria** — descanso
  y stopwatch con cambio de app >30s y apagado de pantalla.
- [ ] 9. Warnings `react-hooks/exhaustive-deps` (líneas 429, 494, 1212, 1271): evaluar **caso a caso** y documentar la decisión.
  ⚠️ NO añadir `loadData`/`runLoginSync` a los deps arrays a ciegas: cambian en
  cada render y crearían bucles de efectos. Las líneas 494/1212 son el listener
  de auth y la carga inicial — su deps `[]`/`[session]` es intencionada; la
  salida correcta es `// eslint-disable-next-line react-hooks/exhaustive-deps`
  con comentario justificando, no "arreglar" el array.
- [ ] 10. De paso en Fase 2 (bajo riesgo, ya ejecutado o en curso según estado): variables sin usar (`showShenronModal`:138, `assigningRoutineDayValue`:226, `_`:662), `@ts-ignore` → `@ts-expect-error` (`src/db/seed.ts`:3) y limpieza de `no-explicit-any` (14 en src, empezando por `src/db/localDb.ts`).

## ✔️ Criterios de Verificación
- [ ] La aplicación se compila exitosamente sin errores de importación o tipos.
- [ ] No existen fragmentos de código, variables o estilos correspondientes a JJK sin usar.
- [ ] El tamaño de `App.tsx` se reduce a menos de 500 líneas de código.
