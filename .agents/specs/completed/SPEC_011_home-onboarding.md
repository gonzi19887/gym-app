---
id: SPEC_011
title: Pantalla Hoy Simplificada + Onboarding
status: completed
priority: high
branch: dev
created: 2026-07-04
updated: 2026-07-06
depends_on: SPEC_009
linear_id: a30a31dd-5566-4e0c-b9ab-e64831acbad7
linear_key: GON-75
---
## 🎯 Objetivo
Centrar la pantalla principal en el entrenamiento (un solo CTA primario), añadir indicadores de salud simplificados (objetivo semanal, hidratación) y crear una pantalla de onboarding obligatoria para nuevos usuarios.

## 📐 Alcance

### ✅ "Hoy" simplificado
- **CTA gigante de entrenamiento**: Inicia directamente la rutina programada para el día actual ("INICIAR RITUAL 🦾") o abre un selector dropdown elegante en caso de no haber rutinas hoy.
- **Racha y XP**: Racha de entrenamiento renombrada como "Zenkai: X días" y estadísticas de Ki (XP) en el header.
- **Días entrenados esta semana**: Comparación interactiva del progreso actual contra la meta semanal.
- **Indicador de agua diaria 💧**: Widget interactivo que permite añadir vasos/mililitros de agua y se resetea automáticamente cada día.
- **Eliminación de elementos secundarios**: Tarjeta de Composición Corporal e historial de Récords Personales (Zenkai Boosts) removidos del tab principal y movidos al tab de Perfil.

### ✅ Onboarding (Flag en LocalStorage)
- **Paso 1: Identidad Z**: Configuración del nombre, raza/clan y avatar con un carrusel de 6 presets vectoriales SVG integrados (compatibles offline) o carga personalizada/captura de cámara.
- **Paso 2: Fisonomía Ki**: Registro de Peso (kg) y Estatura (cm) con cálculo de IMC en tiempo real.
- **Paso 3: Disciplina**: Selección de la cantidad de días de entrenamiento objetivo a la semana.
- **Paso 4: Primera Rutina**: Elección guiada entre 3 plantillas preestablecidas ("Maestro Roshi", "Fuerza Saiyan" o "Personalizada Vacía").

### ❌ Excluye
- Onboarding para usuarios que ya tengan el flag `onboarding_completed` activo.
- Configuración de login social durante el onboarding (se maneja mediante la autenticación base).

## 🔧 Requisitos Técnicos
- **Archivos**: `src/App.tsx`, `src/index.css`
- **Almacenamiento**: `localStorage` para hidratación (`water_intake_YYYY-MM-DD`), meta semanal (`weekly_goal_days`), peso (`user_weight`), altura (`user_height`) y estado (`onboarding_completed`).
- **Assets**: Presets SVG en línea inyectados como Data URLs para soportar modo local/offline sin red.

## 📋 Tareas
- [x] 1. Crear variables de estado en `App.tsx` para onboarding y tracking de agua.
- [x] 2. Implementar visualización y navegación del Onboarding Wizard (Paso 1 al 4).
- [x] 3. Programar el guardado automático de datos y la inicialización de plantillas en la base de datos local al hacer click en "Finalizar Forja".
- [x] 4. Rediseñar la pestaña "Hoy" eliminando las tarjetas de marcas y composición.
- [x] 5. Añadir los widgets de "Objetivo Semanal", "CTA Gigante / Iniciar Ritual" y "Hidratación del Guerrero" en el tab Hoy.
- [x] 6. Mover "Marcas Récords" y "Composición Corporal" a la pestaña de Perfil.
- [x] 7. Vincular la cámara y el input de carga de archivos existente con el avatar del onboarding.
- [x] 8. Integrar la limpieza de datos de onboarding en la función de "Restablecer Templo".

## ✔️ Criterios de Verificación
- [x] Si es un usuario nuevo (o sin flag), el wizard de onboarding debe bloquear e impedir el acceso al resto de pestañas de la aplicación.
- [x] El Paso 2 calcula dinámicamente el IMC y lo resalta según el color de su rango (Bajo peso, Normal, Sobrepeso, Obesidad).
- [x] Finalizar el onboarding crea automáticamente la rutina predefinida seleccionada y permite la entrada a la aplicación.
- [x] El widget de agua funciona y guarda los datos específicos para la fecha del día actual, reiniciándose al cambiar la fecha.
- [x] Si hay una rutina programada hoy, el CTA principal destaca con animación de pulso, facilitando el inicio rápido de la rutina.

## 🧪 Verificación agent-browser
- **URL**: [https://gym-app-git-dev-oscarmarley1988-6438s-projects.vercel.app](https://gym-app-git-dev-oscarmarley1988-6438s-projects.vercel.app)
- **Flujo de prueba**:
  1. Ingresar en modo invitado o crear una cuenta nueva.
  2. Verificar que se renderiza el wizard de onboarding en el Paso 1.
  3. Completar los pasos, elegir una plantilla de rutina y finalizar.
  4. Constatar la redirección al Home simplificado con el CTA gigante, widget de agua y racha Zenkai.
  5. Ir a Perfil y confirmar la presencia de las tarjetas de IMC y marcas récords.
