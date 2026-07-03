---
id: SPEC_004
title: Offline Circuit Breaker — Sync Queue Size Limit
status: completed
priority: medium
branch: dev
created: 2026-06-29
updated: 2026-06-29
commit: 1a57f6e
---

## 🎯 Objetivo
Implementar un límite máximo de operaciones en la cola de sincronización offline (SyncQueue) para evitar que el IndexedDB se llene indefinidamente cuando el usuario no tiene conexión por períodos prolongados, previniendo fallos en la base de datos local.

## 📐 Alcance

### ✅ Incluye
- Límite configurable de items en `sync_queue` (Circuit Breaker pattern)
- Cuando se alcanza el límite: descartar las operaciones más antiguas (FIFO)
- Log en consola al activarse el circuit breaker
- Documentación del límite en `AGENTS.md` y en el informe de seguridad

### ❌ Excluye
- UI para notificar al usuario del límite (sin alertas visuales por ahora)
- Configuración del límite desde la interfaz

## 🔧 Requisitos Técnicos
- **Archivos afectados**: `src/db/sync.ts`, `src/db/localDb.ts`
- **Patrón**: Circuit Breaker con límite FIFO
- **Límite por defecto**: definido en `sync.ts`
- **Sin cambios en Supabase**

## 📋 Tareas
- [x] Añadir constante `MAX_SYNC_QUEUE_SIZE` en `sync.ts`
- [x] Implementar check antes de cada `enqueue` en la sync queue
- [x] Descartar operaciones más antiguas si se supera el límite
- [x] Documentar el comportamiento en `AGENTS.md`
- [x] Añadir informe de seguridad (`docs/security-report`)

## ✔️ Criterios de Verificación
- [x] La sync queue nunca supera el límite definido
- [x] El funcionamiento offline básico no se ve afectado
- [x] No hay errores de IndexedDB en sesiones largas offline

## 🧪 Verificación
- Estado: ✅ Verificado y documentado. Commit `1a57f6e` en `origin/dev`
