---
id: SPEC_015
title: "Accessibility (a11y) P0 — Nombres accesibles para TalkBack/NVDA"
status: done
priority: medium
branch: dev
created: 2026-10-07
updated: 2026-10-20
closed: 2026-10-09
sealed: 2026-10-20
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
  cuenta atrás expandida). El **overlay de sincronización ya no existe** (2026-10-09, Q3): lo
  sustituye la barra fina de estado, que también lleva `role="status"` + `aria-live="polite"`.
- [x] 4. Contraste del tiempo de ejercicio → **diagnóstico y fix hecho** (2026-10-07): el widget
  `App.tsx:3398-3471` tiene fondo oscuro hardcodeado `rgba(10,10,15,0.95)` y con
  `data-theme="light"` sus textos usaban tokens oscuros → ~1,1:1. Fix puntual: colores fijos
  = valores del tema oscuro (≥6,5:1 en claro, sin cambio en oscuro). **7 declaraciones, sin tocar
  tokens.** ⚠️ `auditor-ui` no disponible (cuota Gemini) → **re-cruce pendiente**.
- [x] 5. Verificación: `npm run lint` **8 problemas = base sin empeorar** (tras Fase 3), `npm run build` + `verify_build.py` exit 0.
- [x] 6. Deploy de fases aisladas (ciclo completo): F4 `88f80c2b9b` · F5 `82fb580ae5`.
- [x] 7. **Cierre 2026-10-09 — los 4 fixes de contraste pendientes del re-cruce (Fase 5), de una vez:**
  1. Widget del cronómetro: botón "Pausar" `#ef4444` → **`#f87171`** (4,11:1 → ~6:1 sobre
     `rgba(10,10,15,0.95)`) y los dos bordes con `var(--border-color)` → **`rgba(255,255,255,0.18)`**
     fijo (era oscuro sobre oscuro, invisible).
  2. Nueva clase scoped **`.always-dark-surface`** en `src/index.css`: redefine `--bg-primary`,
     `--text-*` y `--border-color` **solo** dentro de superficies de fondo siempre oscuro, más
     overrides de `.btn-secondary`/`.btn-primary`. Tokens globales intactos. Aplicada a **exactamente
     4 superficies**: banner de descanso (`App.tsx` `workout-rest-timer-banner`), overlay de descanso
     y los 2 overlays del glosario (lista + detalle).
  3. Glosario: el encabezado del detalle dejó de ser transparente con `--border-color` invisible en
     tema claro (fondo forzado a oscuro dentro de la clase).
  4. Rótulo "Intervalo de Recarga" y stroke SVG del cronómetro: `var(--accent-primary)` → **`#f4a261`**
     fijo (en tema claro el token es terracota `#aa3015` → 2,83:1 sobre este fondo oscuro).
- [x] 8. **Revisión final y deploy** (`7c21ae89`, desplegado 2026-10-09): revisión hecha por el agente
  principal porque `auditor-ui`/`revisor-codigo` estaban caídos por cuota de Gemini free-tier. Hallazgos
  corregidos en esa revisión: **P1** `.floating-bar` con `z-index: 300` se pintaba sobre el overlay de
  descanso (150) y el banner (100) → bajado a `30`; **P2** "Cerrar" de la barra no borraba el error
  persistido → reaparecía en cada arranque; **P2** arrancar sin red pintaba la app de rojo → guard de
  `navigator.onLine`. ⚠️ **Queda pendiente re-lanzar `auditor-ui`** cuando vuelva la cuota para sellar
  el veredicto oficial.

- [x] 9. **SELLADO 2026-10-20** — re-cruce oficial con `auditor-ui` (el pendiente
  de cuota desde 2026-10-09): **veredicto SELLADO**, 0 P0 y 0 P1. Los 4 fixes de
  contraste de la tarea 7 verificados intactos (App.tsx:3533 `#f87171`,
  index.css:1232 bordes `rgba(255,255,255,0.18)`, `.always-dark-surface` en
  index.css:1227 aplicada a las 4 superficies exactas, rótulo/stroke `#f4a261`
  en App.tsx:3523/3607). 56 aria-label, 31 campos con nombre accesible, 0 sin él.
  **Único hallazgo: 1 P2** → encabezado del detalle del glosario
  (`App.tsx` header del overlay) con `backgroundColor: 'transparent'` →
  **corregido el mismo día** a `var(--bg-primary)` (dentro de
  `.always-dark-surface` = oscuro siempre). Nota: la misión "mezcla
  claro/oscuro" del mismo informe dio **0 hallazgos estáticos** (todos los
  componentes usan `var(--bg-*)` con fallback correcto).

## ✔️ Criterios de Verificación

- [x] **0 botones de solo icono sin nombre accesible** (escáner: 109 = 53 con aria-label + 87 con texto... los 95 de App.tsx: 22 aria-label + 87 con texto + 0 sin nombre). El criterio inicial "grep aria-label ≥ 90" estaba basado en el supuesto "~91 botones son solo-icono", **desmentido por el inventario medido**.
- [x] **0 campos** sin `label[for]` ni `aria-label` (escáner).
- [x] El cronómetro de descanso anuncia cambios → `role="status"`/`aria-live` aplicado.
  **✅ Verificación manual con TalkBack validada por el usuario (2026-10-21):**
  avisa cuando se completa el tiempo de descanso y también funciona con el
  banner minimizado. Con esto **SPEC_015 queda 100 % cerrado** (sin criterios
  abiertos).
- [x] `tsc -b && vite build` exit 0 · `verify_build.py` exit 0 · verif. prod **PASS** (F4 y F5).
- [x] Ningún token de diseño Stitch modificado.

## 🔗 Relaciones

- SPEC_014 (Code Quality) — los `set-state-in-effect` riesgosos documentados allí.
- SDD completo en el vault: `PROYECTOS\Gym App Jujutsu Kaisen PWA\SDD_Calidad_Ramas_Lint_A11y_2026-10-07.md`.
- Informe lint crudo: `~\.opencode\plan\lint_report_2026-10-07.txt`.
