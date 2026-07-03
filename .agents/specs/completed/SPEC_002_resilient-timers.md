---
id: SPEC_002
title: Timers Resilientes — Page Visibility API
status: completed
priority: high
branch: dev
created: 2026-06-30
updated: 2026-07-01
commit: dc9a5df
---

## 🎯 Objetivo
Hacer que el temporizador de descanso y el cronómetro de ejercicio no se congelen cuando el smartphone bloquea la pantalla o el usuario minimiza la app, usando timestamps absolutos en lugar de decrementos relativos.

## 📐 Alcance

### ✅ Incluye
- Reemplazo de `setInterval` con decremento relativo por **timestamp absoluto** (`Date.now() + duración`)
- Listener de `visibilitychange` para recalcular tiempo restante al reactivar la app
- Si el descanso expiró en background: detener reloj + reproducir alerta sonora inmediatamente
- Reubicación del banner `.workout-rest-timer-banner` a `position: fixed; top: 68px` para evitar solapamiento con la barra de navegación

### ❌ Excluye
- Service Workers para notificaciones push cuando la app está cerrada (eso es SPEC_007)
- Vibración del dispositivo (ya existía, no se modifica)

## 🔧 Requisitos Técnicos
- **Archivos afectados**: `src/App.tsx`, `src/index.css`
- **APIs usadas**: `document.addEventListener('visibilitychange')`, `Date.now()`
- **Animación**: `.slideDown` keyframe en CSS para el banner flotante
- **z-index**: Banner en `z-index: 100` sobre todos los elementos

## 📋 Tareas
- [x] Refactorizar lógica de timer a timestamps absolutos
- [x] Implementar handler `visibilitychange`
- [x] Lógica de "timer expiró en background"
- [x] Reubicar banner a `top: 68px` con animación slideDown
- [x] Verificar no hay colisión visual con cronómetro inferior

## ✔️ Criterios de Verificación
- [x] Timer no se congela al bloquear pantalla (verificado en dispositivo real)
- [x] Al desbloquear: si el tiempo expiró → sonido inmediato
- [x] Al desbloquear: si queda tiempo → continúa desde donde debe estar
- [x] Banner minimizado visible en parte superior sin solapar nada

## 🧪 Verificación con agent-browser
- Flujo: Iniciar entrenamiento → iniciar descanso → simular visibilitychange
- Estado: ✅ Verificado manualmente en dispositivo móvil real (2026-07-01)
