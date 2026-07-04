---
id: SPEC_008
title: Sync Engine Refactor — Outbox Pattern Robusto
status: completed
priority: high
branch: dev
created: 2026-07-04
updated: 2026-07-04
depends_on: SPEC_007
---

## 🎯 Objetivo
Refactorizar el motor de sincronización para que IndexedDB sea SIEMPRE
la fuente de verdad local y Supabase sea únicamente el espejo cloud.
Nunca datos cloud sobreescriben datos locales frescos.

## 📐 Alcance

### ✅ Incluye
- Toda escritura: IndexedDB PRIMERO → cola Outbox → Supabase async
- Sync unidireccional en escritura (local → cloud)
- Bidireccional solo en login inicial (seed desde Supabase)
- Operaciones idempotentes con UUIDs únicos (sin duplicados en reintentos)
- Resolución de conflictos: timestamp local gana si es más reciente

### ❌ Excluye
- PowerSync / RxDB (sobre-ingeniería para este proyecto — ponytail rule)
- Realtime subscriptions de Supabase

## 🔧 Requisitos Técnicos
- **Archivos**: `src/db/sync.ts`, `src/db/localDb.ts`
- **Pattern**: Outbox con replay secuencial al recuperar conexión
- **Ponytail**: Solución mínima viable, sin librerías externas nuevas
