# Sistema de Diseño y Guía de Estilo de AppGimnasio (Google Stitch)

Este documento contiene la especificación oficial del sistema de diseño extraído de **Google Stitch** para la aplicación **AppGimnasio**. Define los tokens de color, tipografía, formas, elevación y componentes visuales que componen la interfaz "Jujutsu Fitness".

---

## 🌌 Personalidad de Marca y Estilo Visual
El sistema de diseño encarna la intensidad mística y de alta energía del universo de **Jujutsu Kaisen**, fusionada con una experiencia de fitness enfocada y de primera calidad. La personalidad de la marca es poderosa, disciplinada y vanguardista, posicionando al usuario como un "Hechicero" que pule su "Energía Maldita".

La estética visual adoptada es **Minimalismo Glassmórfico**:
- Utiliza tonos profundos de obsidiana para proporcionar un entorno de entrenamiento enfocado y libre de distracciones.
- Se acentúa con colores neón de alta frecuencia que señalan el máximo rendimiento y precisión técnica.
- La interfaz de usuario se siente ligera pero conectada, utilizando capas translúcidas y desenfoques suaves para crear profundidad sin desorden.

---

## 🎨 Paleta de Colores Oficial (Obsidian Dark)
La paleta está anclada en un color neutro especializado llamado **Obsidian Dark**, diseñado para mantener la profundidad en pantallas OLED evitando negros aplastados.

- **Fondo General (`#131314`):** El abismo oscuro sobre el que descansa toda la interfaz.
- **Primario (`#b8d300` - Electric Lime):** Usado exclusivamente para acciones de alta prioridad, estados de progreso activo y "Zonas de Enfoque". Representa el pico de intensidad.
- **Secundario (`#ddb7ff` - Neon Purple):** Reservado para períodos de recuperación (descansos), detalles específicos de marca y celebración de récords personales (Destellos Negros).
- **Surface Level 1 (`#1c1b1c`):** El fondo para tarjetas y contenedores de información, separado del fondo general por un sutil borde de 1px.
- **Tipografía:**
  - Texto Primario: Off-white de alto contraste (`#e5e2e3`).
  - Texto Secundario: Muted olive-tinted gray (`#c6c9ad`) para reducir el ruido visual en metadatos.

---

## font-family 📂 Tipografía
El sistema utiliza una tipografía dual estricta:
1. **Outfit (Expresiva):** Usada para títulos, números de contadores y marcas de peso para transmitir un ambiente tecnológico, geométrico y moderno.
2. **Inter (Funcional):** Elegida por su legibilidad superior en texto de cuerpo, descripciones de ejercicios e instrucciones de ejecución.

### Escala de Texto:
- `display-lg`: Outfit, 48px, Bold (títulos de gran impacto).
- `headline-lg`: Outfit, 32px, Semi-Bold (pantallas principales).
- `metric-xl`: Outfit, 40px, Bold (números de series y temporizadores).
- `body-lg`: Inter, 18px, Regular.
- `body-md`: Inter, 16px, Regular.
- `label-lg`: Inter, 14px, Medium.

---

## 📏 Layout y Espaciado (Fluid Grid)
El sistema está basado en una escala base de **4px**.
- Las vistas móviles se estructuran en una cuadrícula de 4 columnas, expandiéndose a 12 columnas en pantallas de escritorio.
- **Zonas de Enfoque**: Las tarjetas utilizan espaciados internos de `md` (16px) o `lg` (24px) para respirabilidad sobre fondo oscuro.
- **Objetivos de Tacto**: Los botones y áreas de toque tienen un tamaño mínimo de **48x48px** para garantizar la facilidad de uso bajo fatiga muscular.

---

## 🌫️ Elevación, Profundidad y Formas
El diseño rechaza las sombras tradicionales y prefiere el uso de capas tonales y desenfoques:
- **Bordes en lugar de sombras**: Las tarjetas se definen con bordes finos de 1px en `rgba(255, 255, 255, 0.05)`.
- **Difuminados de Fondo (Backdrop Blurs)**: Los modales y barras de navegación flotantes usan fondos semi-transparentes `rgba(255, 255, 255, 0.08)` con un desenfoque de fondo de `20px`.
- **Bordes Redondeados**:
  - Elementos pequeños (botones/inputs): 8px (`rounded-sm`).
  - Contenedores principales (tarjetas): 16px (`rounded-lg`).
  - Botones principales de acción: Formato **Píldora** completamente redondeado (`rounded-full`).
