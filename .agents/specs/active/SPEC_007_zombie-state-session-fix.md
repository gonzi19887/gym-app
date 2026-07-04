---
id: SPEC_007
title: Fix Zombie State Supabase + Session Loss + Perfil Persistente
status: active
priority: critical
branch: dev
created: 2026-07-04
updated: 2026-07-04
issues: "#2 popup sync, #3 pérdida rutina, #4 foto/nombre no guarda"
---

## 🎯 Objetivo
Eliminar los tres bugs críticos que hacen la app inutilizable en mobile:
el popup de sync al bloquear pantalla, la pérdida completa de la rutina
activa al regresar a la app, y el perfil/foto que nunca persiste.

## 🔬 Investigación (NotebookLM + Web)
Causa raíz confirmada: el cliente Supabase entra en "zombie state" cuando el
browser suspende el tab (llamada, bloqueo, notificación). El WebSocket muere
silenciosamente. Al detectar `visibilitychange`, la app trigerea sync → popup.
En casos peores, el `auth.getSession()` devuelve null → reinicio de estado →
pérdida de rutina activa.

## 📐 Alcance

### ✅ Incluye
- **Recovery Wrapper**: en `visibilitychange`, verificar sesión ANTES de sync.
  Si zombie state detectado → recrear cliente Supabase silenciosamente.
- **Popup de sync**: mostrar SOLO cuando hay operaciones reales en cola outbox,
  no al detectar visibilitychange.
- **Rutina activa persistida**: snapshot del estado de rutina en IndexedDB
  tras cada set completado. Si app recarga, recuperar estado automáticamente.
- **Perfil/Foto**: guardar en IndexedDB PRIMERO (inmediato), sync Supabase
  en segundo plano. Nunca perder datos por fallo de red.

### ❌ Excluye
- Refactor completo del Sync Engine (eso es SPEC_008)
- Cambios de diseño/UI (eso es SPEC_009+)

## 🔧 Requisitos Técnicos
- **Archivos**: `src/db/sync.ts`, `src/db/localDb.ts`, `src/App.tsx`
- **APIs**: `document.visibilitychange`, `supabase.auth.getSession()`
- **Storage**: IndexedDB stores: `active_workout_state`, `user_profile`
- **Sin cambios** en esquema Supabase

## 📋 Tareas
- [ ] 1. Recovery Wrapper en `sync.ts`: detectar zombie state antes de sync
- [ ] 2. Desacoplar popup sync de visibilitychange — solo mostrar con cola > 0
- [ ] 3. Crear store `active_workout_state` en IndexedDB (`localDb.ts`)
- [ ] 4. Snapshot de rutina activa en cada set completado (`App.tsx`)
- [ ] 5. Recovery de rutina activa al montar la app
- [ ] 6. Persistir perfil/foto en IndexedDB primero, Supabase async
- [ ] 7. Verificar con agent-browser: bloquear pantalla → regresar → rutina intacta

## ✔️ Criterios de Verificación
- [ ] Bloquear pantalla durante entrenamiento → regresar → rutina activa intacta
- [ ] Recibir llamada → colgar → sin popup de sync si no hay operaciones pendientes
- [ ] Cambiar a otra app → regresar → sin pérdida de datos
- [ ] Guardar foto → cerrar app → reabrir → foto guardada
- [ ] Guardar nombre → cerrar app → reabrir → nombre guardado
- [ ] No hay popup de sync al volver de background si la cola está vacía

## 🧪 Verificación agent-browser
URL: https://gym-app-git-dev-oscarmarley1988-6438s-projects.vercel.app/#
Flujo:
1. Login → iniciar rutina → completar 2 sets
2. Simular visibilitychange (via DevTools)
3. Verificar rutina intacta + sin popup espurio
