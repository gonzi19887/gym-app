---
id: SPEC_006
title: Entrenamiento Activo — Modo Sesión Mejorado
status: active
priority: high
branch: dev
created: 2026-07-03
updated: 2026-07-06
linear_id: d49af164-b37a-4ede-94ff-f4da1f815253
linear_key: GON-89
---

## 🎯 Objetivo
Rediseñar la interfaz de entrenamiento activo para maximizar el enfoque del usuario durante el ejercicio, minimizando la fricción de registro a menos de 8 segundos por serie, incorporando respuestas hápticas y animaciones dinámicas tipo Zenkai Boost al romper marcas.

## 📐 Alcance

### ✅ Modo Sesión (Enfoque Completo)
- **Overlay de Pantalla Completa**: Oculta la navegación global (Navbar) para evitar toques erróneos.
- **Progreso en Tiempo Real**: Barra circular de progreso en la cabecera mostrando el porcentaje de sets completados respecto al total programado (inspiración Dribbble Fullfit).
- **Steppers de Serie Activa**: Controles de incremento de peso/repeticiones de gran tamaño (`48x48px`) con la directiva `onFocus={(e) => e.target.select()}` para evitar concatenación en teclados móviles.
- **Micro-interacciones y Haptics**: Vibración breve al confirmar un set y vibración triple intensa al romper un récord (Zenkai Boost).

### ✅ Respuestas y Resumen
- **Temporizador de Descanso Integrado**: Se inicia automáticamente al finalizar un set. Muestra una cuenta regresiva circular e incluye alertas sonoras.
- **Resumen Final de Batalla**: Modal resumen al terminar el entrenamiento mostrando la XP (Energía de Ki) total acumulada, el Tonelaje total levantado y un desglose de los récords personales (Zenkai Boosts) rotos.

### ❌ Excluye
- Tracking de ritmo cardíaco mediante dispositivos corporales (smartwatch).

## 🔧 Requisitos Técnicos
- **Archivos**: `src/App.tsx`, `src/index.css`
- **APIs**: `navigator.vibrate()`, Web Audio API para alertas sonoras.
- **Storage**: IndexedDB (`active_workout_state`) para recuperar la sesión si la app se congela o recarga.

## 📋 Tareas
- [ ] 1. Diseñar el overlay de entrenamiento activo en pantalla completa ocultando la barra inferior de navegación.
- [ ] 2. Implementar la barra circular superior de progreso de sets (Dribbble 21068466).
- [ ] 3. Programar steppers numéricos de `48x48px` para peso y repeticiones.
- [ ] 4. Enlazar los inputs numéricos con la regla `onFocus` para selección automática de caracteres.
- [ ] 5. Integrar el disparador de vibración háptica (`navigator.vibrate`) en la confirmación de series.
- [ ] 6. Crear la animación visual Zenkai Boost (relámpagos naranja sobre overlay oscuro) al superar el 1RM histórico de un ejercicio.
- [ ] 7. Programar el flujo automático del temporizador de descanso al presionar check en una serie.
- [ ] 8. Diseñar la pantalla resumen final mostrando las estadísticas consolidadas y XP ganada.

## ✔️ Criterios de Verificación
- [ ] La UI oculta los tabs generales al iniciar un entrenamiento.
- [ ] Completar series actualiza dinámicamente la barra circular de progreso.
- [ ] Al hacer foco en peso/reps en móvil, el texto existente se auto-selecciona.
- [ ] Superar el récord de 1RM activa la animación de Zenkai Boost y el patrón de vibración intensa.
- [ ] Finalizar el entrenamiento muestra el desglose exacto de tonelaje, XP y registros rotos en el modal resumen.
