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
        background: "var(--tw-background)",
        surface: "var(--tw-surface)",
        "surface-level-1": "var(--tw-surface-level-1)",
        "surface-container": "var(--tw-surface-container)",
        "surface-container-low": "var(--tw-surface-container-low)",
        "surface-container-high": "var(--tw-surface-container-high)",
        "surface-container-highest": "var(--tw-surface-container-highest)",
        "surface-container-lowest": "var(--tw-surface-container-lowest)",
        "surface-variant": "var(--tw-surface-variant)",
        "surface-dim": "var(--tw-surface-dim)",
        "surface-bright": "var(--tw-surface-bright)",
        "obsidian-zero": "var(--tw-obsidian-zero)",
        "on-surface": "var(--tw-on-surface)",
        "on-background": "var(--tw-on-background)",
        "on-surface-variant": "rgb(var(--tw-on-surface-variant) / <alpha-value>)",
        primary: "rgb(var(--tw-primary) / <alpha-value>)",
        "primary-container": "var(--tw-primary-container)",
        "primary-fixed": "var(--tw-primary-fixed)",
        "primary-fixed-dim": "var(--tw-primary-fixed-dim)",
        "on-primary": "var(--tw-on-primary)",
        "on-primary-container": "var(--tw-on-primary-container)",
        "on-primary-fixed": "var(--tw-on-primary-fixed)",
        "on-primary-fixed-variant": "var(--tw-on-primary-fixed-variant)",
        secondary: "var(--tw-secondary)",
        "secondary-container": "var(--tw-secondary-container)",
        "secondary-fixed": "var(--tw-secondary-fixed)",
        "secondary-fixed-dim": "var(--tw-secondary-fixed-dim)",
        "on-secondary": "var(--tw-on-secondary)",
        "on-secondary-container": "var(--tw-on-secondary-container)",
        "on-secondary-fixed": "var(--tw-on-secondary-fixed)",
        "on-secondary-fixed-variant": "var(--tw-on-secondary-fixed-variant)",
        tertiary: "var(--tw-tertiary)",
        "tertiary-container": "var(--tw-tertiary-container)",
        "tertiary-fixed": "var(--tw-tertiary-fixed)",
        "tertiary-fixed-dim": "var(--tw-tertiary-fixed-dim)",
        "on-tertiary": "var(--tw-on-tertiary)",
        "on-tertiary-container": "var(--tw-on-tertiary-container)",
        "on-tertiary-fixed": "var(--tw-on-tertiary-fixed)",
        "on-tertiary-fixed-variant": "var(--tw-on-tertiary-fixed-variant)",
        outline: "var(--tw-outline)",
        "outline-variant": "var(--tw-outline-variant)",
        "border-subtle": "var(--tw-border-subtle)",
        "energy-track": "var(--tw-energy-track)",
        error: "rgb(var(--tw-error) / <alpha-value>)",
        "error-container": "var(--tw-error-container)",
        "on-error": "var(--tw-on-error)",
        "on-error-container": "var(--tw-on-error-container)",
        "inverse-primary": "var(--tw-inverse-primary)",
        "inverse-surface": "var(--tw-inverse-surface)",
        "inverse-on-surface": "var(--tw-inverse-on-surface)",
        "surface-tint": "var(--tw-surface-tint)",
        "accent-primary": "rgb(var(--tw-accent-primary) / <alpha-value>)",
        "accent-secondary": "rgb(var(--tw-accent-secondary) / <alpha-value>)",
        "accent-alert": "rgb(var(--tw-accent-alert) / <alpha-value>)",
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
