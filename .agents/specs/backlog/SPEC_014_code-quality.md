---
id: SPEC_014
title: Code Quality — Ponytail Audit + Atomic Design Components
status: active
priority: medium
branch: dev
created: 2026-07-04
updated: 2026-07-06
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

## ✔️ Criterios de Verificación
- [ ] La aplicación se compila exitosamente sin errores de importación o tipos.
- [ ] No existen fragmentos de código, variables o estilos correspondientes a JJK sin usar.
- [ ] El tamaño de `App.tsx` se reduce a menos de 500 líneas de código.
