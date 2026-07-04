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
| SPEC_007 | Fix Zombie State Supabase + Session Loss | `4bf2d62` | 2026-07-04 |
| SPEC_008 | Sync Engine Refactor — Outbox Pattern | `29ffbe1` | 2026-07-04 |
| SPEC_009 | Rediseño Dragon Ball — Design System | `cd2823d` | 2026-07-04 |
| SPEC_010 | Rutinas UX — Filtros, GIFs, Carry-Over | `ac84f68` | 2026-07-04 |

---

## 🔵 En Progreso (`/active`)

| ID | Feature | Prioridad |
|---|---|---|
| **SPEC_011** | **Pantalla Hoy Simplificada + Onboarding** | 🔴 critical |

---

## ⚪ Backlog (`/backlog`)

| ID | Feature | Prioridad | Depends |
|---|---|---|---|
| SPEC_006 | Entrenamiento Activo Mejorado | high | — |
| SPEC_012 | Calendario Real + Perfil con Dashboard | medium | SPEC_011 |
| SPEC_013 | Indicador Agua + Peso Carry-Over | medium | SPEC_010 |
| SPEC_014 | Code Quality — Ponytail + Atomic Design | medium | SPEC_012 |

---

## 📐 Workflow SDD Completo

```
💡 Idea
  │
  ▼
🔬 INVESTIGACIÓN — NotebookLM
  │  nlm notebook query gym-app "¿Cómo debería funcionar X?"
  │  nlm research start "mejores prácticas para X en PWA"
  │
  ▼
📝 SPEC.md en /active  ← escribir DESPUÉS de investigar
  │  Usar /grill-me para refinar con el agente
  │
  ▼
⚙️  IMPLEMENTACIÓN en rama dev
  │
  ▼
🧪 VERIFICACIÓN — agent-browser
  │  URL: https://gym-app-git-dev-oscarmarley1988-6438s-projects.vercel.app/#
  │
  ▼
✅ SPEC movida a /completed → deploy preview → aprobación → producción
```

### Notebooks de NotebookLM disponibles
- **gym-app** (alias): Documentación técnica del proyecto, Manual de Usuario, Tutorial Pantallas
- Configurado con `nlm alias set gym-app <notebook-id>`
