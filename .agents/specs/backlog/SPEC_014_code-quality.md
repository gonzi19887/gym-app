---
id: SPEC_014
title: Code Quality — Ponytail Audit + Atomic Design Components
status: backlog
priority: medium
branch: dev
created: 2026-07-04
updated: 2026-07-04
depends_on: SPEC_012
---

## 🎯 Objetivo
Dividir el monolito App.tsx (216KB+) en componentes atómicos mantenibles,
eliminar código muerto, y establecer una arquitectura de componentes
sostenible. Aplicar filosofía ponytail: lo más simple que funcione.

## 📐 Alcance

### ✅ Atomic Design (componentes a extraer)
**Átomos:** Button, Input, Badge, Avatar, ProgressBar, TimerCircle
**Moléculas:** ExerciseCard, SetRow, TimerBanner, WaterIndicator, LevelBadge
**Organismos:** WorkoutSession, RoutineBuilder, CalendarView, ProfileDashboard
**Páginas:** HomeScreen, ProfileScreen, CalendarScreen, RoutinesScreen

### ✅ Ponytail Audit
- Eliminar código JJK sin usar tras migración Dragon Ball
- Deduplicar lógica repetida (timers, sync calls)
- Remover imports no usados
- Dividir App.tsx en archivos ≤ 500 líneas cada uno

### ✅ Testing Atómico
- Test por cada átomo con agent-browser
- Verificar cada molécula en aislamiento

### ❌ Excluye
- Testing unitario con Jest/Vitest (over-engineering para este stage)
- Storybook (idem)
- TypeScript strict mode (breaking change)
