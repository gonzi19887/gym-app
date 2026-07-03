---
id: SPEC_001
title: Dashboard Premium — Grado Especial
status: completed
priority: high
branch: dev
created: 2026-06-30
updated: 2026-07-01
commit: dc9a5df
---

## 🎯 Objetivo
Rediseñar el tab "Hoy" con un dashboard premium tipo glassmorphism que muestre métricas de entrenamiento del día, composición corporal interactiva y récords personales, elevando la experiencia visual al nivel "Grado Especial" de la temática JJK.

## 📐 Alcance

### ✅ Incluye
- Tarjeta **Bitácora de Batalla**: Tonelaje total (kg), Series completadas, Rituales finalizados
- Widget **Composición Corporal**: Peso, Grasa Corporal, Altura — persistido en `localStorage`
- Cálculo dinámico del **IMC** resaltado en Electric Lime (`#b8d300`) si existen datos
- Tarjeta **Marcas & Destellos**: Récords personales 1RM del usuario
- Diseño glassmorphism con `backdrop-filter: blur` y fondos semitransparentes

### ❌ Excluye
- Gráficas históricas (eso es SPEC_008)
- Integración con Supabase para métricas (solo `localStorage` por ahora)
- Notificaciones al romper un récord (eso es SPEC_007)

## 🔧 Requisitos Técnicos
- **Archivos afectados**: `src/App.tsx`, `src/index.css`
- **Persistencia**: `localStorage` para datos de composición corporal
- **Fórmula IMC**: `peso / (altura_m)²`
- **Design tokens**: Electric Lime `#b8d300`, Surface `#1c1b1c`, Obsidian `#131314`
- **Sin migraciones** de Supabase necesarias

## 📋 Tareas (Breakdown)
- [x] Componente tarjeta Bitácora de Batalla con cálculo de tonelaje
- [x] Widget Composición Corporal con inputs reactivos
- [x] Lógica de IMC con resaltado condicional
- [x] Tarjeta Marcas & Destellos (récords 1RM)
- [x] Estilos glassmorphism en `index.css`

## ✔️ Criterios de Verificación
- [x] Dashboard carga sin errores en modo invitado (offline)
- [x] Tarjeta Tonelaje/Series/Rituales visible en tab Hoy
- [x] Widget composición muestra botón "Actualizar"
- [x] IMC se calcula y muestra en Electric Lime al ingresar datos
- [x] Récords vacíos muestran estado vacío elegante

## 🧪 Verificación con agent-browser
- URL: `https://gym-app-git-dev-oscarmarley1988-6438s-projects.vercel.app/#`
- Flujo: Entrar como invitado → verificar tab Hoy → actualizar composición corporal
- Captura: `dashboard_health_updated.png` ✅ verificada el 2026-07-01
