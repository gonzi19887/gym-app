---
id: SPEC_013
title: Indicador de Agua + Peso Carry-Over en Sesión
status: backlog
priority: medium
branch: dev
created: 2026-07-04
updated: 2026-07-04
depends_on: SPEC_010
---

## 🎯 Objetivo
Añadir un indicador de hidratación durante el entrenamiento basado en
recomendaciones de la NIH, y carry-over de peso entre sets de la sesión.

## 💧 Dato Científico (NIH)
- 150-300 ml cada 15-20 minutos durante el entrenamiento
- Meta para sesión de 1 hora: 500-600 ml
- Máximo: 1.5L/hora (riesgo de hiponatremia)

## 📐 Alcance

### ✅ Indicador de Agua
- Barra de progreso en ml visible durante sesión activa
- Recordatorio vibratorio al llegar al temporizador de descanso > 90s
- "+250ml" botón rápido en pantalla de descanso
- Meta diaria visible en tab Hoy (acumulado)
- Registrado en IndexedDB por día

### ✅ Peso Carry-Over (complemento SPEC_010)
- Al completar serie N: peso pre-llena serie N+1
- Usuario puede editar antes de confirmar el set

### ❌ Excluye
- Tracking de electrolitos
- Integración con smartwatch para sudoración
