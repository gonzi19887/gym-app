# Informe de Auditoría de Seguridad (Adaptación de Patrones de Agentes de Trading)

Este informe aplica los principios de la skill **`llm-trading-agent-security`** (Saneamiento, Aislamiento, Límites de Ejecución y Manejo de Claves) a la arquitectura de **AppGimnasio**, evaluando la robustez y seguridad de la aplicación ante inyecciones, fugas de secretos y fallos de autorización en Supabase.

---

## 🔍 1. Análisis de Amenazas y Vectores de Ataque

Aunque **AppGimnasio** no opera con transacciones financieras de criptomonedas o acciones como un bot de trading de LLM, comparte el riesgo de **fuga de datos privados** y **manipulación de base de datos** si se violan los controles de acceso.

### Mapeo de Conceptos de Seguridad de Trading a Fitness:

| Principio de Seguridad (Trading) | Mapeo Aplicado (AppGimnasio) | Estado de Implementación |
| :--- | :--- | :--- |
| **Sanitización de Prompts** | Validación de Entradas de Ejercicios y Nombres | **Seguro**: No se realizan llamadas dynamic client-side a LLM. |
| **Circuit Breakers** | Límites de Peticiones y Cola Offline | **Seguro**: Control local de IndexedDB previene spam. |
| **Aislamiento de Wallet/Claves** | Separación de Claves API de Supabase | **Seguro**: Clave `service_role` aislada del frontend. |
| **Simulación Pre-Envío** | Validación Local de Estructura SQL | **Seguro**: Validación determinista de UUIDs en IndexedDB. |

---

## 🛡️ 2. Resultados de la Auditoría Detallada

### A. Gestión de Secretos y Aislamiento (Wallet Isolation Equivalent)
- **Hallazgo**: Se auditó el código fuente en React/Vite (`src/`) y no se detectó ninguna referencia a la clave administrativa de Supabase (`SUPABASE_SERVICE_ROLE_KEY`).
- **Evaluación**: **Excelente**. El frontend de la aplicación cliente solo tiene acceso a la clave pública `anon` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), garantizando que un usuario malicioso en el navegador no pueda secuestrar privilegios administrativos.

### B. Row Level Security (RLS) en Supabase
- **Hallazgo**: Se revisaron las políticas de seguridad en `supabase_schema.sql` y se confirmó que RLS está habilitado explícitamente en el 100% de las tablas relacionales:
  - `profiles`, `exercises`, `routines`, `routine_exercises`, `workouts`, `workout_sets`.
- **Evaluación**: **Seguro**. Las políticas de inserción y actualización están ancladas estrictamente a la sesión autenticada (`auth.uid() = user_id`), impidiendo que un Chamán de nivel inferior lea o altere los datos de entrenamiento de otro.

### C. Prevención de Inyecciones de Código en Nombres de Ejercicios (SQL Injection)
- **Hallazgo**: La aplicación importa un catálogo JSON local de 1284 ejercicios.
- **Evaluación**: **Seguro**. Las sentencias de sincronización SQL en `update_exercises.sql` y el código de IndexedDB realizan un saneamiento de comillas simples (`replace("'", "''")`) y estructuran los datos a través de parámetros sanitizados antes de guardarse.

### D. Resiliencia de la Cola Offline (Circuit Breakers / Rate Limiting)
- **Hallazgo**: La app almacena las peticiones pendientes en `sync_queue` de IndexedDB cuando el usuario entrena sin conexión a Internet.
- **Evaluación**: **Mejorable**. Si un usuario genera spam malicioso simulando entrenamientos offline de forma masiva, al volver online podría saturar la API de Supabase con miles de peticiones secuenciales.
- **Recomendación**: Añadir un límite máximo (ej. no más de 100 elementos) en la cola `sync_queue` de IndexedDB. Si se supera el límite, el manager local debe pausar el encolado temporalmente (actuando como un disyuntor o *circuit breaker*).

---

## 📋 Lista de Verificación Pre-Despliegue de Seguridad

- [x] RLS (Row Level Security) habilitado en el 100% de las tablas de Supabase.
- [x] Secretos administrativos (`service_role`) excluidos del bundle JS público de Vercel.
- [x] Validación y escape de caracteres especiales en el cargador SQL de ejercicios.
- [x] IndexedDB configurado con IDs deterministas de tipo UUIDv4.
- [ ] Implementar límite de desbordamiento (circuit breaker) en la cola `sync_queue` offline.
