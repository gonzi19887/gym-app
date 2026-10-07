---
id: SPEC_015
title: "Accessibility (a11y) P0 — Nombres accesibles para TalkBack/NVDA"
status: active
priority: medium
branch: dev
created: 2026-10-07
updated: 2026-10-07
---

## 🎯 Objetivo

Llevar la app al mínimo WCAG 2.1 AA para lectores de pantalla (TalkBack en
Android, NVDA/VoiceVoice en escritorio) **sin alterar el diseño visual**.
Origen: análisis externo "Software Design Document — Análisis de Ramas,
Calidad de Código y Accesibilidad/Diseño UI" (recibido 2026-10-07) y
verificación directa sobre `dev` (commit 0922ee9).

**Datos verificados (2026-10-07):** 93 `<button>` en `src/App.tsx` pero solo
**2 `aria-label`** en toda la app · 27 `<input>` de los cuales ~25 sin
`<label htmlFor>` ni `aria-label` · 4 `outline: none` globales en
`src/index.css` (líneas 841, 1065, 1228, 1463) · cronómetro y overlay de sync
sin anuncio de estado (`aria-live`).

## 📐 Alcance

### ✅ En alcance (Fase 3 del SDD de calidad)

1. **Botones de solo icono** (Lucide: X de cerrar, Plus/Minus de series,
   Trash2, minimizar temporizador…): añadir `aria-label` en español,
   descriptivo y único por contexto (p.ej. `aria-label="Cerrar rutina"` vs
   `aria-label="Cerrar aviso"`).
2. **Inputs sin etiqueta** (27): donde exista etiqueta visible → `id` +
   `<label htmlFor>`; donde no (p.ej. peso/repeticiones en línea) →
   `aria-label` directo.
3. **Estados dinámicos**: `role="status"` + `aria-live="polite"` en el
   contenedor del cronómetro de descanso y en el overlay de sincronización,
   para que el countdown y "Registros sincronizados" se anuncien.
4. **Contraste puntual del "tiempo de ejercicio"**: el usuario reporta que el
   cronómetro del ejercicio **no se lee** por contraste. Se pasa primero al
   subagente `auditor-ui` (reporte archivo:línea) y se corrige **solo el
   estilo concreto** de ese elemento, no tokens globales.

### ❌ Fuera de alcance (decisiones posteriores, no incluidas aquí)

- **P1 — `<div>` clicables → `<button>` + anillo `focus-visible`**: altera
  estilos/estructura; requiere revisión de diseño (decisión del usuario
  2026-10-07: "no es bueno cambiar el diseño").
- **P2 — contraste global de tokens** (`--text-tertiary: #6b7280` sobre
  `#10131e` < 4.5:1): **prohibido tocar sin `auditor-ui`** — el token pertenece
  al diseño Stitch vigente (Chronos Athletic System).

## 📋 Tareas

- [x] 1. Inventario de botones solo-icono (escáner `~\.opencode\plan\scan_a11y.py`, parser JSX) → aplicar `aria-label`.
  **Inventario medido 2026-10-07 (corrige la estimación inicial):** 109 botones en src/ (95 en App.tsx)
  = 87 con texto visible (ya tienen nombre) + **17 solo-icono** + 3 ligaduras material + 2
  con aria-label. Se añadieron **50 aria-label** (53 en total): 13 steppers/play-pause/skip/trash,
  3 material (edit/casino/vpn_key), 4 chips con texto dinámico y los 30 campos.
- [x] 2. Los campos sin etiqueta → `aria-label` (30: input/textarea/select; los visibles repiten su
  label visible → Label in Name; file inputs ocultos e inline con nombre propio).
- [x] 3. `role="status"`/`aria-live="polite"` en cronómetro de descanso (banner minimizado +
  cuenta atrás expandida) y en la tarjeta del overlay de sync.
- [x] 4. Contraste del tiempo de ejercicio → **diagnóstico y fix hecho** (2026-10-07): el widget
  `App.tsx:3398-3471` tiene fondo oscuro hardcodeado `rgba(10,10,15,0.95)` y con
  `data-theme="light"` sus textos usaban tokens oscuros → ~1,1:1. Fix puntual: colores fijos
  = valores del tema oscuro (≥6,5:1 en claro, sin cambio en oscuro). **7 declaraciones, sin tocar
  tokens.** ⚠️ `auditor-ui` no disponible (cuota Gemini) → **re-cruce pendiente**.
- [x] 5. Verificación: `npm run lint` **8 problemas = base sin empeorar** (tras Fase 3), `npm run build` + `verify_build.py` exit 0.
- [x] 6. Deploy de fases aisladas (ciclo completo): F4 `88f80c2b9b` · F5 `82fb580ae5`.

## ✔️ Criterios de Verificación

- [x] **0 botones de solo icono sin nombre accesible** (escáner: 109 = 53 con aria-label + 87 con texto... los 95 de App.tsx: 22 aria-label + 87 con texto + 0 sin nombre). El criterio inicial "grep aria-label ≥ 90" estaba basado en el supuesto "~91 botones son solo-icono", **desmentido por el inventario medido**.
- [x] **0 campos** sin `label[for]` ni `aria-label` (escáner).
- [ ] El cronómetro de descanso anuncia cambios → `role="status"`/`aria-live` aplicado; **verificación manual con TalkBack pendiente del usuario**.
- [x] `tsc -b && vite build` exit 0 · `verify_build.py` exit 0 · verif. prod **PASS** (F4 y F5).
- [x] Ningún token de diseño Stitch modificado.

## 🔗 Relaciones

- SPEC_014 (Code Quality) — los `set-state-in-effect` riesgosos documentados allí.
- SDD completo en el vault: `PROYECTOS\Gym App Jujutsu Kaisen PWA\SDD_Calidad_Ramas_Lint_A11y_2026-10-07.md`.
- Informe lint crudo: `~\.opencode\plan\lint_report_2026-10-07.txt`.
