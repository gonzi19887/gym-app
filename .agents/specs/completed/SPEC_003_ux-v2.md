---
id: SPEC_003
title: UX v2.0 — Navegación, Perfil Tab, Rutinas Flat
status: completed
priority: high
branch: dev → main
created: 2026-06-26
updated: 2026-06-26
commit: f6f64e9
deployed: https://gym-app-ten-lovat.vercel.app
linear_id: aaa702fd-01ef-4942-955d-7e35b4d823ed
linear_key: GON-16
---
## 🎯 Objetivo
Rediseño completo de la navegación y las pantallas principales para mejorar la usabilidad mobile-first: Perfil como tab completa, Rutinas con búsqueda flat sin acordeones, y Glosario accesible desde el Dashboard.

## 📐 Alcance

### ✅ Incluye
- **Navegación**: 5 tabs — Hoy | Calendario | Rutinas | Progreso | Perfil (eliminado "Ejercicios")
- **Tab Perfil**: Reemplaza el modal `showProfileEditor`. Avatar JJK con selector horizontal deslizable. Botón pill "Guardar Cambios" fijo al fondo
- **Forjar Dominio (Rutinas)**: Sin acordeones de categorías. Búsqueda flat — panel de resultados aparece solo al escribir. Sets/Reps/Rest inline en "Técnicas Seleccionadas"
- **Glosario de Técnicas**: Oculto del menú, accesible como tarjeta en tab Hoy
- **Tipografía**: Todo `font-size < 12px` elevado a `12px` mínimo

### ❌ Excluye
- Calendario interactivo avanzado (solo visualización)
- Edición de ejercicios del catálogo global

## 🔧 Requisitos Técnicos
- **Archivos afectados**: `src/App.tsx`, `src/index.css`
- **Sin cambios en DB**: Solo UI/UX, sin migraciones
- **Mobile-first**: Diseñado para 375px de ancho mínimo

## 📋 Tareas
- [x] Refactorizar barra de navegación a 5 items
- [x] Crear componente Tab Perfil con avatar selector
- [x] Refactorizar Rutinas a búsqueda flat
- [x] Mover Glosario a tarjeta en Dashboard
- [x] Auditar y corregir todos los font-size < 12px

## ✔️ Criterios de Verificación
- [x] 5 tabs visibles en navbar inferior
- [x] Perfil abre como tab, no como modal
- [x] Buscador de rutinas vacío → sin panel; con texto → panel de resultados
- [x] Glosario visible como tarjeta en tab Hoy
- [x] No hay texto < 12px en ninguna pantalla

## 🧪 Verificación con agent-browser
- URL de prod: `https://gym-app-ten-lovat.vercel.app`
- Estado: ✅ Verificado y en producción desde 2026-06-26
