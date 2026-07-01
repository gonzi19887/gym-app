# Arquitectura Offline y Sincronización (PWA, Service Worker e IndexedDB)

Este documento detalla el funcionamiento técnico del motor sin conexión (offline) de **AppGimnasio**. Explica el ciclo de vida de la Progressive Web App (PWA), las estrategias de almacenamiento en la base de datos local **IndexedDB** y la lógica de sincronización bidireccional con Supabase.

---

## 📶 1. Estrategia PWA y Service Worker
Para permitir que la aplicación se instale en dispositivos móviles (iOS/Android) y funcione en áreas de baja o nula conectividad (como sótanos de gimnasios), implementamos un Service Worker de ciclo de vida completo.

### Características del Service Worker:
1. **Precaching de Assets Estáticos**:
   Al compilar e instalar la app, se almacenan en caché el HTML principal, hojas de estilo CSS (`index.css`), bundles de Javascript y archivos estáticos (como fuentes Outfit/Inter e imágenes SVG).
2. **Estrategia de Caching de Ejercicios**:
   - Para las llamadas de API de recursos pequeños y el catálogo JSON de **1284 ejercicios**, se aplica una estrategia de **Stale-While-Revalidate**:
     - Se sirve instantáneamente el catálogo desde la caché local para un renderizado inmediato.
     - En segundo plano, se busca una versión más reciente y, si existe, se actualiza silenciosamente la caché.
3. **Soporte de Fallback Offline**:
   Si la app no puede conectar por red para cargar un recurso nuevo y este no está en caché, se redirige a una ruta local offline precargada en el shell.

---

## 🗄️ 2. Base de Datos Local: IndexedDB
La aplicación utiliza **IndexedDB** como almacenamiento local de alto rendimiento. Se implementa a través de un envoltorio nativo (o Dexie) estructurado en `src/db/localDb.ts`.

### Estructura de Almacenes (Stores):
1. **`profiles`**: Almacena el perfil del usuario local (nombre, nivel, XP, racha).
2. **`exercises`**: Copia local del catálogo de 1284 ejercicios para búsquedas y filtrados instantáneos en la interfaz.
3. **`workouts`**: Sesiones de entrenamiento completadas por el usuario.
4. **`workout_sets`**: Series asociadas a las sesiones de entrenamiento.
5. **`sync_queue`**: La cola de transacciones que almacena las operaciones realizadas sin conexión a Internet.

---

## 🔄 3. Motor de Sincronización y Cola de Operaciones (Sync Queue)

Cuando el usuario completa un entrenamiento o modifica una rutina sin conexión a Internet:

1. **Persistencia Local**: La transacción se guarda inmediatamente en IndexedDB para que las estadísticas y el calendario se actualicen visualmente sin delay.
2. **Encolado de Sincronización**: Se inserta un registro en la tabla local `sync_queue`:
   ```typescript
   interface SyncQueueItem {
     id: string;             // UUID autogenerado
     action: 'CREATE' | 'UPDATE' | 'DELETE';
     tableName: 'workouts' | 'workout_sets' | 'profiles';
     payload: any;           // Datos de la entidad
     timestamp: string;      // ISO del cambio
   }
   ```
3. **Escucha de Red (Network Listener)**:
   - La aplicación escucha los eventos globales de red del navegador: `window.addEventListener('online', processSyncQueue)`.
   - Tan pronto como la conexión se restablece, el **Sync Manager** despierta en segundo plano.
4. **Procesamiento de Cola en Supabase**:
   - Las operaciones en `sync_queue` se envían a Supabase en orden cronológico estricto para mantener la consistencia relacional.
   - Si la API responde con éxito (`200 OK`), la operación se elimina de la cola.
   - Si ocurre un fallo de red o servidor temporal, la operación permanece en cola y se reintenta en la siguiente reconexión.
5. **Sincronización Manual**:
   - En la pantalla de **Perfil**, el usuario puede visualizar si hay operaciones en cola (ej. `Tienes 3 entrenamientos pendientes de sincronizar`) y presionar el botón `Sincronizar ahora` para forzar la carga manual a la nube.
6. **Mecanismo de Desconexión Rápida (Circuit Breaker)**:
   - Para prevenir la degradación del rendimiento de IndexedDB, se implementó un límite máximo de **100 elementos** en la cola de sincronización. Si se supera este límite, la aplicación entra en estado preventivo, alertando al usuario sobre la necesidad de restaurar la conexión antes de continuar guardando entrenamientos adicionales.

---

## ⏰ 4. Resiliencia de Temporizadores en Segundo Plano

Los navegadores web de los smartphones suspenden los hilos de ejecución de JavaScript (`setInterval`/`setTimeout`) en milisegundos tras bloquearse la pantalla o minimizarse la aplicación. Esto afectaba gravemente el seguimiento del descanso entre series y la duración del entrenamiento.

### Soluciones Implementadas:
1. **Lógica de Tiempo Absoluto Delta**:
   - En lugar de restar `1` a un contador en cada ciclo de `setInterval`, almacenamos una marca de tiempo absoluta en el futuro (`timerTargetTimeRef` = `Date.now() + restDuration * 1000`).
   - El intervalo simplemente calcula el tiempo restante en base a `Math.max(0, Math.ceil((targetTime - Date.now()) / 1000))`.
2. **Sincronización con Page Visibility API**:
   - Escuchamos el evento `visibilitychange` a través del navegador.
   - En el momento en que la propiedad `document.visibilityState === 'visible'` (cuando el usuario desbloquea el teléfono o regresa a la aplicación), recalculamos de inmediato la diferencia de tiempo transcurrida.
   - Si la marca de tiempo de destino ya pasó en segundo plano, se detiene el reloj de descanso y se reproduce instantáneamente el zumbido/alerta sonora para notificar al usuario.
