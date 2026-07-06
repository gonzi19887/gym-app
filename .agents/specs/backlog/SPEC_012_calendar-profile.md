---
id: SPEC_012
title: Calendario Google Calendar Style + Perfil con Dashboard
status: active
priority: medium
branch: dev
created: 2026-07-04
updated: 2026-07-06
linear_id: 0ad80035-52af-46a8-ac25-ac14dafff658
linear_key: GON-91
---

## 🎯 Objetivo
Rediseñar la pestaña de Calendario como un visor de mes completo interactivo con swipe, y potenciar la pestaña de Perfil agregando un dashboard con gráficas de rendimiento, volumen de carga semanal e historial de récords.

## 📐 Alcance

### ✅ Calendario Interactivo
- **Mini-Calendar Mes**: Componente superior con swipe horizontal para navegar entre meses y celdas de días marcadas si hubo entrenamiento (Zenkai).
- **Vista de Agenda Semanal**: Listado cronológico debajo de la celda seleccionada mostrando la duración del ritual, ejercicios realizados, volumen total y agua diaria.
- **Acceso Directo**: Botón rápido en la agenda para clonar/repetir un ritual del pasado como una sesión activa.

### ✅ Perfil con Dashboard
- **Métricas de Fisonomía Z**: Widget interactivo de peso, grasa e IMC (reubicados desde Hoy).
- **Gráficos de Tendencia**: Gráfico de barras o líneas mostrando el volumen de toneladas levantadas por semana (useMemo para agregación óptima).
- **Logros y Nivel**: Ficha de nivel DBZ con medallas de logros desbloqueados (ej. "Meta Semanal Alcanzada", "Ki Máximo", "10 Rituales").

### ❌ Excluye
- Integración externa con las APIs de Google Calendar u Outlook.

## 🔧 Requisitos Técnicos
- **Archivos**: `src/App.tsx`, `src/index.css`
- **Visualización**: Charts simplificados con SVG en línea para evitar la sobrecarga de dependencias pesadas (conservando la ponytail rule).
- **Storage**: IndexedDB consultas agregadas sobre las tablas `workouts` y `workout_sets`.

## 📋 Tareas
- [ ] 1. Crear el visor de calendario mensual con cuadrícula dinámica y swipe.
- [ ] 2. Diseñar la lista de agenda/resumen inferior reactiva al día seleccionado.
- [ ] 3. Implementar el disparador "Repetir Ritual" para cargar una rutina histórica en el entrenamiento activo.
- [ ] 4. Maquetar el Perfil como un dashboard consolidando composición corporal.
- [ ] 5. Crear el motor SVG para renderizar gráficos de líneas de volumen semanal e historial de 1RMs.
- [ ] 6. Añadir el componente de medallas/logros vinculando el estado de IndexedDB.

## ✔️ Criterios de Verificación
- [ ] El calendario mensual permite navegar de forma fluida hacia meses anteriores/posteriores.
- [ ] Seleccionar un día en el calendario filtra y muestra instantáneamente la ficha resumen de la agenda.
- [ ] El botón de repetir rutina carga los mismos ejercicios y sets de la sesión seleccionada en el panel activo.
- [ ] El perfil carga correctamente los gráficos de volumen calculados a partir de los sets guardados.
