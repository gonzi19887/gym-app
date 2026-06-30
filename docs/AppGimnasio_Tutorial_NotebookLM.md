# Guía y Tutorial de Pantallas de AppGimnasio (Jujutsu Fitness)

Este documento sirve como material de referencia detallado y estructurado para alimentar a **NotebookLM**, permitiendo la generación de infografías, resúmenes y guías visuales de cada pantalla de la aplicación.

---

## 🌌 Temática y Concepto General: El Camino del Hechicero
**AppGimnasio** fusiona el seguimiento del entrenamiento deportivo con el universo de *Jujutsu Kaisen*. En este sistema:
- **Energía Maldita (EM)** representa la Experiencia (XP) acumulada al levantar peso y completar rutinas.
- **Grados de Hechicero**: Rangos que progresa el usuario desde *4.º Grado* (principiante) hasta *Grado Especial* (élite de fitness).
- **Voto Vinculante (Binding Vow)**: Representa la racha diaria de entrenamientos consecutivos. Romper la racha debilita tu "energía maldita".
- **Destello Negro (Black Flash)**: Animación relámpago que celebra la rotura de un Récord Personal (PR) de 1RM estimado por set.

---

## 📱 1. Pantalla "Hoy" (Panel del Chamán / Home)

### 🔘 Propósito
Es el centro de operaciones diario del usuario. Muestra el estado actual del hechicero, su progreso de nivel y le permite seleccionar y lanzar su misión de entrenamiento para el día.

### 🔘 Elementos de la Interfaz de Usuario
1. **Perfil del Hechicero (Header)**:
   - Avatar mágico del usuario, nombre de hechicero, clan seleccionado (ej. Gojo, Zen'in) y técnica maldita personalizada.
   - Insignia de **Voto Vinculante**: Muestra la racha de entrenamientos semanales consecutivos con el texto `Voto: X m`.
2. **Tarjeta de Energía Maldita (XP Card)**:
   - Barra de progreso interactiva con un resplandor púrpura.
   - Muestra los puntos de Energía Maldita actual y requerida para ascender (ej. `320 / 1000 EM`).
   - Límites de rango indicando el grado actual y el siguiente rango por alcanzar (ej. `4.° Grado -> 3.° Grado`).
3. **Misiones Semanales (Calendario Semanal)**:
   - Cuadrícula de 7 días (Lunes a Domingo).
   - Los días entrenados se muestran con un círculo verde brillante y una marca de verificación (`✓`).
   - El día actual se destaca con un borde especial de enfoque.
4. **Misiones del Día (Selector de Rutinas)**:
   - Listado de todas las rutinas de entrenamiento creadas por el usuario.
   - Si no hay rutinas, muestra una alerta que invita al usuario a crear su primera rutina con un botón de acceso directo.
   - Cada rutina muestra su nombre y un botón de inicio rápido `Iniciar Misión ⚡`.

---

## 🏋️ 2. Pantalla "Entrenamiento Activo" (La Purificación)

### 🔘 Propósito
Pantalla interactiva en formato overlay a pantalla completa que guía al usuario repetición a repetición durante su entrenamiento activo, manejando tiempos de descanso y registrando récords personales en vivo.

### 🔘 Elementos de la Interfaz de Usuario
1. **Encabezado de Misión**:
   - Título de la rutina activa y subtítulo temático (*"Purificando Energía Maldita"*).
   - Botón `Cancelar` (para abortar la sesión) y botón `Completar` (guarda la sesión al finalizar todas las series).
2. **Selector de Ejercicios (Progress Dots)**:
   - Fila superior de puntos interactivos. Cada punto representa un ejercicio en la rutina.
   - El ejercicio actual brilla en color púrpura. Los completados se vuelven de color blanco sólido con una sombra difuminada.
3. **Tarjeta de Ejercicio Activo**:
   - Etiqueta del grupo muscular (ej. Pecho, Piernas) e índice de la misión (ej. `Misión 2 de 5`).
   - Nombre oficial en español.
   - **Visualización de Técnica**: Caja contenedora que reproduce el GIF demostrativo oficial del ejercicio.
   - **Técnica Maldita de Ejecución (Collapsible Tips)**: Pestaña desplegable con instrucciones paso a paso para ejecutar el ejercicio con la forma correcta.
   - **Última Sesión Realizada**: Sección desplegable que muestra de forma compacta el peso y repeticiones logradas por serie en la última sesión para este ejercicio específico.
4. **Tabla interactiva de Series (Set Table)**:
   - **Columnas**: Serie, Peso (kg), Repeticiones, Estado (Checkbox).
   - **Comportamiento inteligente**: Solo la serie activa está habilitada para entrada de datos. Las series futuras se muestran translúcidas para evitar distracciones.
   - Al marcar el Checkbox como completado:
     - Se inicia automáticamente el **Temporizador de Descanso**.
     - El dispositivo vibra brevemente.
     - Se evalúa si el set superó el 1RM histórico de ese ejercicio usando la fórmula de Epley: `1RM = Peso * (1 + Reps / 30)`.
5. **Evento "Destello Negro" (Black Flash PR Event)**:
   - Si el usuario supera su récord de 1RM, la pantalla realiza un flash negro completo y muestra un banner gigante que celebra el récord alcanzado con una vibración en ráfaga doble.
6. **Temporizador de Descanso**:
   - Círculo de progreso animado que se minimiza de forma no intrusiva en la esquina inferior.
   - Muestra mensajes temáticos de descanso (*REST_REMINDERS*) e hidratación.
   - Permite saltar el temporizador (`Omitir`) o añadir 30 segundos extra.

---

## 📅 3. Pantalla "Calendario" (Bitácora de Batallas)

### 🔘 Propósito
Permite al usuario examinar su historial a largo plazo, visualizar la frecuencia de sus entrenamientos mensuales y desglosar cada entrenamiento realizado anteriormente.

### 🔘 Elementos de la Interfaz de Usuario
1. **Calendario Mensual Interactivo**:
   - Vista de calendario de cuadrícula tradicional.
   - Permite navegar entre meses anteriores.
   - Los días en los que se completó un entrenamiento se muestran resaltados con un color púrpura brillante, animando al usuario a no romper la cadena.
2. **Historial de Combates (Timeline)**:
   - Línea de tiempo vertical debajo del calendario.
   - Muestra las rutinas completadas en orden cronológico inverso.
   - Cada tarjeta del historial incluye:
     - Fecha y hora exacta de finalización.
     - Nombre de la rutina realizada.
     - Resumen estadístico: Total de series completadas y **Tonelaje Total** levantado (suma de peso × repeticiones).
     - Acordeón desplegable: Al hacer clic en un entrenamiento anterior, se expande una lista detallada que muestra cada ejercicio realizado con sus series correspondientes, peso, repeticiones y si fue completado con éxito.

---

## 🛠️ 4. Pantalla "Rutinas" (Forja de Hechizos)

### 🔘 Propósito
Sección de planificación donde el usuario construye y gestiona sus rutinas de entrenamiento a largo plazo y busca dentro de la biblioteca de 1284 ejercicios disponibles.

### 🔘 Elementos de la Interfaz de Usuario
1. **Lista de Rutinas Guardadas**:
   - Tarjetas informativas de cada rutina creada por el usuario.
   - Muestra el nombre, número total de ejercicios de la rutina y las categorías musculares principales que impacta.
   - Opciones: `Iniciar`, `Editar` o `Eliminar`.
2. **Creador y Editor de Rutinas (Modal)**:
   - Panel interactivo para asignar un nombre a la rutina y añadirle ejercicios de la biblioteca.
   - Permite arrastrar, reorganizar o eliminar ejercicios de la rutina.
3. **Glosario de Hechizos (Buscador del Catálogo de Ejercicios)**:
   - Barra de búsqueda interactiva integrada en el editor de rutinas.
   - Permite filtrar el catálogo de **1284 ejercicios** mediante un selector rápido por grupos musculares principales (Abdomen, Brazos, Pecho, Espalda, Hombros, Piernas, Cardio/Estiramiento).
   - Cada ejercicio se despliega con su nombre en español, su categoría y un botón para añadirlo directamente a la rutina en edición.

---

## 📊 5. Pantalla "Progreso" (Técnica Inversa / Estadísticas)

### 🔘 Propósito
Proporciona análisis y retroalimentación analítica detallada sobre la fuerza del usuario, volumen acumulado y equilibrio de grupos musculares entrenados.

### 🔘 Elementos de la Interfaz de Usuario
1. **Tarjetas de Estadísticas Globales**:
   - Muestra valores agregados del usuario:
     - **Misiones completadas**: Cantidad total de entrenamientos registrados.
     - **Volumen Total**: Suma acumulada de toneladas levantadas en toda la historia de la aplicación.
     - **Series Totales**: Contador global de series completadas.
     - **Racha de Voto Vinculante**: Racha activa máxima en días consecutivos de entrenamiento.
2. **Mapa de Músculos Trabajados (Cursed Muscle Map)**:
   - Silueta anatómica interactiva del cuerpo humano (vista frontal y trasera).
   - Se ilumina de manera proporcional a la cantidad de series completadas para cada grupo muscular en el historial del usuario. Los músculos no entrenados se muestran opacos y oscuros, mientras que los más entrenados brillan en tonos púrpuras y cian.
3. **Gráficos de Evolución de Fuerza (1RM Charts)**:
   - Gráfico de líneas dinámico e interactivo.
   - Permite al usuario seleccionar cualquier ejercicio de su base de datos.
   - Traza una línea temporal que muestra el progreso del **1RM Estimado**, el peso máximo levantado y el volumen total movido para ese ejercicio.

---

## ⚙️ 6. Pantalla "Perfil" (Ajustes del Hechicero)

### 🔘 Propósito
Administra la identidad del usuario en la aplicación, gestiona los respaldos locales, configura las opciones estéticas y realiza la sincronización en la nube con Supabase.

### 🔘 Elementos de la Interfaz de Usuario
1. **Editor de Perfil del Chamán**:
   - Permite cambiar el nombre del usuario, Clan de Jujutsu y Técnica Maldita personalizada.
   - **Cámara del Avatar**: Herramienta interactiva para encender la webcam/cámara frontal y tomar una fotografía en vivo para actualizar la imagen de perfil del usuario de forma inmediata.
2. **Sincronización en la Nube (Supabase Cloud Sync)**:
   - Estado de la conexión con Supabase.
   - Indicador de la **Cola de Sincronización Pendiente**: Si el usuario entrena sin conexión a Internet, la aplicación guarda las misiones localmente en IndexedDB. En esta pantalla se visualiza cuántos entrenamientos están pendientes de subida y se ofrece un botón de sincronización manual para enviarlos a la base de datos cloud de Supabase.
3. **Mantenimiento y Respaldo de Datos (IndexedDB Manager)**:
   - Opciones para descargar un respaldo completo de los entrenamientos en formato JSON.
   - Opción de importar un respaldo JSON anterior para restaurar todo el historial del usuario.
   - Botón de restablecimiento y borrado completo de base de datos local para reiniciar el entrenamiento desde cero.
