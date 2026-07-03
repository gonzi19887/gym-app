---
id: SPEC_005
title: Catálogo 1279 Ejercicios ES + GIFs Offline
status: completed
priority: high
branch: dev → main
created: 2026-06-29
updated: 2026-06-30
commit: 5793dcb
---

## 🎯 Objetivo
Construir y desplegar un catálogo completo de 1279 ejercicios en español con GIFs demostrativos almacenados localmente, sincronizados tanto en IndexedDB (offline) como en Supabase (cloud), usando UUIDs deterministas para consistencia.

## 📐 Alcance

### ✅ Incluye
- 1279 ejercicios scrapeados de FitnessProgramer.com y traducidos al español
- GIFs clasificados por grupo muscular en `public/images/<GRUPO>/`
- Solo archivos `.gif` (eliminadas todas las imágenes estáticas `.jpg/.png`)
- `scraped_exercises_es.json` como fuente de datos local (3.13 MB)
- Script `seed.ts` con UUIDs deterministas (emulando hash JS en Python)
- Umbral de semilla: si `exercises < 1000 en IndexedDB` → re-sembrar
- Subida a Supabase via `upsert_supabase.py` con Service Role Key (bypass RLS)

### ❌ Excluye
- Edición de ejercicios por el usuario
- Ejercicios personalizados (user_id != NULL en tabla exercises)
- Videos (solo GIFs)

## 🔧 Requisitos Técnicos
- **Archivos afectados**: `src/db/scraped_exercises_es.json`, `src/db/seed.ts`, `public/images/`
- **Scripts**: `sanitize_exercises.py`, `scrape_perfect.py`, `update_exercises.sql`
- **Supabase**: Tabla `exercises` con `user_id = NULL` para ejercicios globales
- **UUIDs**: Deterministas — misma semilla genera mismo UUID siempre
- **Categorías**: PECHO, ESPALDA, HOMBROS, BRAZOS, PIERNAS, ABDOMEN, etc.

## 📋 Tareas
- [x] Scraping de 1279 ejercicios (`scrape_perfect.py`)
- [x] Traducción y mapeo al español (`sanitize_exercises.py`)
- [x] Limpieza de assets: eliminar todo excepto `.gif` (`clean_images.py`)
- [x] Generación de `scraped_exercises_es.json`
- [x] Script `seed.ts` con umbral y UUIDs deterministas
- [x] Subida a Supabase con `upsert_supabase.py` (1279/1279 ✅)
- [x] Deploy a producción con umbral de semilla 1000

## ✔️ Criterios de Verificación
- [x] IndexedDB contiene ≥ 1279 ejercicios tras primera carga
- [x] GIFs cargan correctamente en la vista de ejercicio
- [x] Supabase tabla `exercises` tiene 1279 registros con `user_id = NULL`
- [x] Búsqueda por nombre y filtro por categoría funcionan

## 🧪 Verificación
- Estado: ✅ En producción desde 2026-06-29
- Script de verificación: `list_local_exercises.py`
