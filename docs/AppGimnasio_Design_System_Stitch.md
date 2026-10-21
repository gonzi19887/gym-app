# Sistema de Diseño y Guía de Estilo de AppGimnasio (Google Stitch)

Este documento contiene la especificación oficial del sistema de diseño extraído de **Google Stitch** para la aplicación **AppGimnasio**. Define los tokens de color, tipografía, formas, elevación y componentes visuales que componen la interfaz **"Capsule Corp Fitness Tech"** (tema *Chronos Athletic System*, Gen 2).

> **Historial:** la Gen 1 ("Jujutsu Fitness": lima `#d4f032`/`#b8d300`, púrpura `#ddb7ff`, obsidiana `#0e0e0f`/`#131314`) fue **retirada** el 2026-09-29 tras la auditoría Stitch ↔ `dev`. Esos tokens están prohibidos: no reintroducirlos.

---

## 🌌 Personalidad de Marca y Estilo Visual

La personalidad de marca es la energía del universo **Dragon Ball / Capsule Corp** (progreso = **"Ki"**, transformación de las 7 esferas → **Shenron**, niveles *Humano Normal → Goku Ultra Instinto*), con la estética **Athletic Tech de cápsula espacial**:

- Entorno oscuro profundo y enfocado (cámara del tiempo / cámara gravitacional de Capsule Corp).
- Acentos cálidos **ámbar solar** para la acción principal y **cian scouter** para datos/estado.
- Capas tonales (superficies escalonadas) en lugar de sombras marcadas; bordes finos como definición.
- Tipografía deportiva geométrica (Outfit) para impacto y funcional (Inter) para lectura.

> **2026-10-20 — limpieza de flavor JJK (puro).** Se retiraron de la UI las
> referencias exclusivas de *Jujutsu Kaisen*: placeholders "Gojo Satoru",
> "BLACK FLASH" (→ "RÉCORD PERSONAL"), "Energía Maldita" (→ "Energía (XP)"),
> "hechicero" (→ "atleta" / "guerrero") y el concepto "Técnica Maldita" (→ campo
> `cursed_technique`, que se conserva por compatibilidad de datos, con etiqueta
> visible "Técnica Especial"). **Se mantienen** la gamificación y el flavor
> Capsule Corp: Ki, Shenron, las 7 esferas, los niveles y los nombres de rutina
> temáticos.

---

## 🎨 Paleta de Colores Oficial (Chronos Dark)

Anclada en el fondo **`#10131e`** (Space Navy), diseñado para OLED sin negros aplastados.

### Tokens de color

| Token | Valor | Uso |
|---|---|---|
| `background` / `surface` | `#10131e` | Fondo general de la app |
| `surface-container-low` | `#181b26` | Tarjetas y contenedores (nivel 1) |
| `surface-container` | `#1c1f2a` | Superficie media (dropdowns, botones secundarios) |
| `surface-container-high` | `#272935` | Superficie elevada (inputs, chips, badges) |
| `surface-container-highest` | `#313440` | Superficie más alta (tooltips, popovers) |
| `outline-border` | `#2e354b` | Bordes de 1px de tarjetas, inputs y nav (**token oficial de borde**; el Home usa la variante `#2a2f42`, misma familia) |
| `primary` (ámbar claro) | `#ffc499` | Estados hover/claros del primario |
| `primary-container` (**Sun Ki Amber**) | `#f4a261` | **Color de marca**: acciones de alta prioridad, progreso activo, racha, acentos de header |
| `capsule-vermilion` | `#e05638` | Alertas, degradados de CTA (`#e05638 → #f4a261`), estados de error |
| `secondary` (**Scouter Cyan**) | `#6fd8c8` | Datos telemétricos, barras de progreso secundarias, estados de info |
| `secondary-bright` | `#2dd4bf` | Variante brillante del cian (highlights de datos) |
| `on-surface` | `#e0e1f1` | Texto primario |
| `on-surface-muted` | `#94a3b8` | Texto secundario/metadatos |
| `on-surface-variant` | `#d8c2b5` | Texto terciario con calidez ámbar |

### Texto sobre ámbar

- Sobre `#f4a261`: usar texto oscuro **`#2f1400`** (contraste AA). Nunca blanco.

---

## 📂 Tipografía

Tipografía dual estricta:

1. **Outfit (Expresiva):** títulos, números de contadores, métricas y botones de acción.
2. **Inter (Funcional):** cuerpo de texto, descripciones de ejercicios, etiquetas.

### Escala de texto

- `display-lg`: Outfit, 48px, Black (títulos de gran impacto, KPIs).
- `headline-lg/md`: Outfit, 32/24px, Bold (títulos de pantalla).
- `metric-xl`: Outfit, 40px, Bold (series, temporizadores).
- `body-lg/md`: Inter, 18/16px, Regular.
- `label-lg/sm`: Inter, 14/12px, Medium/Semibold (etiquetas, tags de categoría).

---

## 📏 Layout y Espaciado (Fluid Grid)

- Escala base de **4px**.
- Vista móvil: 4 columnas (la app es single-column, max-width 480px centrado); desktop hasta 12 columnas.
- Padding de zonas de enfoque: `md` (16px) / `lg` (24px).
- Objetivo de toque mínimo: **48×48px** (botones y áreas interactivas).

---

## 🌫️ Elevación, Profundidad y Formas

- **Bordes en lugar de sombras:** tarjetas definidas con borde 1px `outline-border #2e354b`.
- **Superficies escalonadas:** 4 niveles (`#181b26` → `#1c1f2a` → `#272935` → `#313440`) para jerarquía sin sombras pesadas.
- **Backdrop blur** en headers sticky y nav flotante (`bg-[#10131e]/90-95 + backdrop-blur`).
- **Bordes redondeados:**
  - Inputs/controles pequeños: 8–12px.
  - Tarjetas: 16px (`rounded-2xl`).
  - Botones principales y CTAs: **píldora** (`rounded-full`).
- **Glow ámbar sutil** (`drop-shadow(0 0 8px rgba(244,162,97,.3))`) reservado a elementos de marca activos.

---

## 🧭 Navegación

- **Actual (app):** 5 tabs — Hoy / Calendario / Rutinas / Progreso / Perfil.
- **Stitch (diseño):** 4 tabs — Home / Plan / Workout / Profile.
- ⏳ Decisión pendiente (P1c): mantener 5 o migrar a 4. Hasta entonces, el hero de Home de Stitch se adapta dentro de la pestaña "Hoy".

---

## 🖥️ Pantallas de referencia (proyecto Stitch)

Diseños oficiales descargados en `plan\stitch\` (17 PNG + 17 HTML + `manifest.json`):

| Pantalla | ID |
|---|---|
| Capsule Corp Home – Dark Mode | `6b630e4a` |
| Capsule Corp Fitness Tech Home | `8885e100` |
| Active Workout – Sentadilla (Dark) | `cba1b673` |
| Active Workout – Modo Descanso (Dark) | `3cc7f172` |
| Transición – Siguiente Ejercicio | `92e089d2` |
| Resumen de Rutina (Dark / Pestañas) | `26096514` / `ceb601b8` |
| Gestor de Rutinas (Dark / Creación) | `237273e3` / `69e00ffa` |
| Planificador Semanal (Capsule Corp / Dark) | `eb59b58a` / `e50e3d48` |
| Calendario Mensual (Capsule Corp / Dark) | `09666751` / `6793b29c` |
| Modal de Sincronización Ki (Light / Dark) | `8b969adf` / `14bff6f0` |

---

## ✅ Mapeo a CSS (implementación real)

Los tokens viven en `src/index.css` como variables CSS:

| Token Stitch | Variable CSS (tema oscuro) |
|---|---|
| `background` / `surface` | `--bg-primary: #10131e` |
| `surface-container-low` | `--bg-secondary: #181b26` |
| `surface-container` | `--bg-tertiary: #1c1f2a` |
| `surface-container-high` | `--bg-surface-elevated: #272935` |
| `primary-container` | `--accent-primary: #f4a261` |
| `secondary` | `--accent-secondary: #6fd8c8` |
| `capsule-vermilion` | `--accent-alert: #e05638` |
| `outline-border` | `--border-color: #2e354b` |
| `on-surface` | `--text-primary: #e0e1f1` |
| `on-surface-variant` | `--text-secondary: #d8c2b5` |
| `on-surface-muted` | `--text-tertiary: #94a3b8` |

El tema claro (**Laboratorio Zenith**: `#fcf9f8` / terracotta `#aa3015`) es **operativo y
coherente** desde el 2026-10-20: la paleta de Tailwind pasó a ser theme-aware
(`var(--tw-*)`), las superficies aisladas (`.surface-isolated`) siguen al tema y
el texto sobre acentos usa `--on-accent`. Detalle en el vault:
`PROYECTOS/Gym App Jujutsu Kaisen PWA/AppGimnasio_Estado_y_Mantenimiento_2026-10.md`.
