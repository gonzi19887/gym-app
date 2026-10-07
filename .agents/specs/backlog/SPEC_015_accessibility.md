---
id: SPEC_015
title: "Accessibility (a11y) P0 — Nombres accesibles para TalkBack/NVDA"
status: backlog
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

- [ ] 1. Inventario de botones solo-icono (grep de `<button` sin texto accesible) → aplicar `aria-label` a todos.
- [ ] 2. Los 27 `<input>` → `<label htmlFor>` o `aria-label` (verificar con grep: 0 inputs sin nombre).
- [ ] 3. `role="status"`/`aria-live="polite"` en cronómetro de descanso + overlay de sync.
- [ ] 4. `auditor-ui`: contraste del tiempo de ejercicio → reporte → fix puntual de estilo (aprobación del usuario antes de aplicar).
- [ ] 5. Verificación: `npm run lint` (sin empeorar: base 28 problemas), `npm run build` + `verify_build.py`.
- [ ] 6. Deploy de fase aislada (ciclo completo, aprobación explícita — Q5-a).

## ✔️ Criterios de Verificación

- [ ] `grep -c "aria-label"` ≥ 90 en `src/App.tsx` y **0 botones de solo icono sin nombre accesible**.
- [ ] **0 inputs** sin `label[for]` ni `aria-label`.
- [ ] El cronómetro de descanso anuncia cambios (verificación manual con TalkBack o role/status en DOM).
- [ ] `tsc -b && vite build` exit 0 · `verify_build.py` exit 0 · `verify_prod_mobile_fix.py` PASS.
- [ ] Ningún token de diseño Stitch modificado.

## 🔗 Relaciones

- SPEC_014 (Code Quality) — los `set-state-in-effect` riesgosos documentados allí.
- SDD completo en el vault: `PROYECTOS\Gym App Jujutsu Kaisen PWA\SDD_Calidad_Ramas_Lint_A11y_2026-10-07.md`.
- Informe lint crudo: `~\.opencode\plan\lint_report_2026-10-07.txt`.
