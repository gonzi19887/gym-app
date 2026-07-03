# 📋 SPEC INDEX — Hechicería Fitness (Gym App)

Índice vivo de todas las especificaciones del proyecto. Actualizar en cada ingest.

> **Regla SDD:** Ninguna feature se implementa sin un SPEC.md previo en `/active`.
> Ningún código llega a producción sin que su spec esté en `/completed` y verificada.

---

## 🟢 Completadas (`/completed`)

| ID | Feature | Commit | Fecha |
|---|---|---|---|
| SPEC_001 | Dashboard Premium (IMC, Tonelaje, Récords) | `dc9a5df` | 2026-07-01 |
| SPEC_002 | Timers Resilientes (Page Visibility API) | `dc9a5df` | 2026-07-01 |
| SPEC_003 | UX v2.0 (Perfil Tab, Rutinas Flat, Glosario) | `f6f64e9` | 2026-06-26 |
| SPEC_004 | Offline Circuit Breaker (Sync Queue Limit) | `1a57f6e` | 2026-06-29 |
| SPEC_005 | Catálogo 1279 Ejercicios ES + GIFs | `5793dcb` | 2026-06-29 |

---

## 🔵 En Progreso (`/active`)

_Ninguna spec activa actualmente._

---

## ⚪ Backlog (`/backlog`)

| ID | Feature | Prioridad |
|---|---|---|
| SPEC_006 | Entrenamiento Activo Mejorado | high |
| SPEC_007 | Notificaciones Push PWA | medium |
| SPEC_008 | Gráficas de Progreso / Historial | medium |
| SPEC_009 | Sincronización Multi-Dispositivo | low |

---

## 📐 Workflow

```
/backlog → /active (al comenzar) → /completed (al verificar con agent-browser)
```

Usar `/grill-me` para refinar specs antes de implementar.
Usar `agent-browser` en `https://gym-app-git-dev-oscarmarley1988-6438s-projects.vercel.app/#` para verificar.
