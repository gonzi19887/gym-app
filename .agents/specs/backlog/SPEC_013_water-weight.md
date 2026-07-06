---
id: SPEC_013
title: Indicador de Agua + Peso Carry-Over en Sesión
status: active
priority: medium
branch: dev
created: 2026-07-04
updated: 2026-07-06
linear_id: 800f7037-2096-4234-bcce-64c616a7bdbb
linear_key: GON-92
---

## 🎯 Objetivo
Reducir la fricción durante la sesión mediante el pre-llenado de datos de series consecutivas en tiempo real y asegurar una hidratación óptima del usuario integrando alertas basadas en las directrices de la NIH (National Institutes of Health).

## 📐 Alcance

### ✅ Hidratación en Entrenamiento (NIH)
- **Barra de Agua en Sesión**: Progreso visual en mililitros integrado en la pantalla de descanso.
- **Acceso Rápido**: Botón de incremento de `+250ml` visible durante la cuenta regresiva de descanso.
- **Recordatorios Hápticos**: Notificación por vibración breve para hidratarse cuando el tiempo de descanso configurado es prolongado (> 90 segundos).
- **Consolidación Diaria**: Toda el agua consumida en la sesión se suma automáticamente a la meta de hidratación de la pestaña Hoy.

### ✅ Arrastre de Peso Inter-Set (Carry-Over)
- **Carry-Over en Tiempo Real**: Al rellenar y guardar el peso y repeticiones de la serie $N$, estos valores se copian por defecto a la serie $N+1$ en el panel activo, permitiendo confirmarlo con un solo toque.

### ❌ Excluye
- Notificaciones push de hidratación fuera de la sesión de entrenamiento activa.

## 🔧 Requisitos Técnicos
- **Archivos**: `src/App.tsx`
- **Recomendación NIH**: 150-300 ml cada 15-20 minutos durante el ejercicio.
- **Storage**: IndexedDB para acumular mililitros de agua por fecha y asociarlos al registro del workout.

## 📋 Tareas
- [ ] 1. Diseñar el widget de barra de agua interactiva en el panel de descanso del entrenamiento activo.
- [ ] 2. Configurar el disparador de vibración para descansos mayores a 90 segundos.
- [ ] 3. Programar la persistencia de la ingesta de agua en IndexedDB vinculada a la fecha y al workout.
- [ ] 4. Desarrollar la lógica de carry-over en tiempo real entre series de la sesión activa de entrenamiento.

## ✔️ Criterios de Verificación
- [ ] La pantalla de descanso muestra la barra de progreso de hidratación y un botón rápido `+250ml`.
- [ ] El consumo registrado en la sesión se refleja en el widget general de agua de la pantalla Hoy.
- [ ] Al guardar la serie 1 con `80 kg x 10 reps`, la serie 2 se pre-llena automáticamente con `80 kg` y `10 reps` en el panel activo.
