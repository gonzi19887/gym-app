---
id: SPEC_011
title: Pantalla Hoy Simplificada + Onboarding
status: backlog
priority: high
branch: dev
created: 2026-07-04
updated: 2026-07-04
depends_on: SPEC_009
---

## 🎯 Objetivo
Centrar la pantalla principal en el entrenamiento (un solo CTA primario)
y añadir una pantalla de onboarding para nuevos usuarios.

## 📐 Alcance

### ✅ "Hoy" simplificado
- CTA gigante: "INICIAR ENTRENAMIENTO" o rutina programada para hoy
- Racha actual + XP del día
- Días entrenados esta semana (vs meta)
- Indicador de agua del día 💧
- Eliminar: Composición corporal, Marcas/Récords (→ van a Perfil)

### ✅ Onboarding (primera vez, flag en IndexedDB)
- Paso 1: Foto + Nombre
- Paso 2: Peso + Estatura (calcula IMC)
- Paso 3: Días por semana en gym (→ meta semanal = logro)
- Paso 4: Crear primera rutina guiada o usar plantilla

### ❌ Excluye
- Onboarding para usuarios existentes (solo nuevos)
- Login social en onboarding (ya existe)
