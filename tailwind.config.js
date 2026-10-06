// Tailwind compilado en build (2026-10-05) — sustituye al Play CDN de
// cdn.tailwindcss.com, que fallaba en móvil y dejaba la pantalla de
// "Crear o Editar Rutina" maquetada con CSS ausente.
// El theme.extend es una copia EXACTA de la config inline que vivía en index.html.
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "on-error": "#690005",
        "surface-container-low": "#181b26",
        "obsidian-zero": "#0b0e18",
        "on-tertiary-container": "#82250e",
        background: "#10131e",
        "error-container": "#93000a",
        "inverse-primary": "#8e4e14",
        "on-surface-variant": "#d8c2b5",
        "surface-dim": "#10131e",
        "on-tertiary-fixed-variant": "#83260e",
        "primary-container": "#f4a261",
        "surface-container-high": "#272935",
        outline: "#a08d80",
        "on-secondary-fixed": "#00201c",
        "on-tertiary-fixed": "#3c0700",
        "on-background": "#e0e1f1",
        "inverse-surface": "#e0e1f1",
        "surface-tint": "#ffb780",
        "on-secondary": "#003731",
        "on-primary-fixed": "#2f1400",
        "energy-track": "#2e354b",
        "outline-variant": "#534439",
        "on-secondary-fixed-variant": "#005048",
        surface: "#10131e",
        "surface-bright": "#363945",
        "secondary-fixed-dim": "#6fd8c8",
        "surface-container": "#1c1f2a",
        "on-surface": "#e0e1f1",
        secondary: "#6fd8c8",
        "inverse-on-surface": "#2d303c",
        "tertiary-fixed-dim": "#ffb4a2",
        "surface-container-lowest": "#0b0e18",
        "surface-variant": "#313440",
        "on-tertiary": "#4e2600",
        "secondary-fixed": "#8cf5e4",
        "tertiary-fixed": "#ffdad2",
        "on-primary-container": "#6f3800",
        "on-error-container": "#ffdad6",
        tertiary: "#ffc2b3",
        "border-subtle": "rgba(255, 255, 255, 0.05)",
        error: "#ffb4ab",
        "secondary-container": "#30a193",
        "surface-container-highest": "#313440",
        "primary-fixed": "#ffdcc4",
        primary: "#f4a261",
        "surface-level-1": "#181b26",
        "on-primary-fixed-variant": "#6f3800",
        "tertiary-container": "#ff9a81",
        "on-primary": "#2f1400",
        "primary-fixed-dim": "#ffb780",
        "on-secondary-container": "#00302a"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        unit: "4px",
        "margin-desktop": "40px",
        xs: "4px",
        lg: "24px",
        sm: "8px",
        "margin-mobile": "20px",
        md: "16px",
        xl: "32px",
        gutter: "16px"
      },
      fontFamily: {
        "label-md": ["Inter"],
        "headline-md": ["Outfit"],
        "headline-lg-mobile": ["Outfit"],
        "label-lg": ["Inter"],
        "body-md": ["Inter"],
        "metric-xl": ["Outfit"],
        "body-lg": ["Inter"],
        "display-lg": ["Outfit"],
        "headline-lg": ["Outfit"],
        headline: ["Outfit"],
        display: ["Outfit"],
        body: ["Inter"],
        label: ["Inter"]
      },
      fontSize: {
        "label-md": ["12px", {lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500"}],
        "headline-md": ["24px", {lineHeight: "32px", fontWeight: "600"}],
        "headline-lg-mobile": ["28px", {lineHeight: "34px", fontWeight: "600"}],
        "label-lg": ["14px", {lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500"}],
        "body-md": ["16px", {lineHeight: "24px", fontWeight: "400"}],
        "metric-xl": ["40px", {lineHeight: "48px", fontWeight: "700"}],
        "body-lg": ["18px", {lineHeight: "28px", fontWeight: "400"}],
        "display-lg": ["48px", {lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700"}],
        "headline-lg": ["32px", {lineHeight: "40px", fontWeight: "600"}]
      }
    }
  },
  plugins: [
    forms,
    containerQueries
  ]
};
