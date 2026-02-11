# Release Notes - v1.3.3 🚀

## Resumen de la Versión
Esta versión unifica el proceso de creación de expedientes y documentos mediante un wizard de 4 pasos, implementa radicado automático para expedientes, simplifica los permisos y mejora la experiencia de usuario.

---

## 🆕 Nuevas Funcionalidades

### 1. Wizard Unificado de Creación de Expedientes
*   **Nuevo flujo de 4 pasos:** Serie/Subserie → Opción de documento → Detalles → Resumen
*   **Radicado automático:** Los expedientes reciben un identificador único con formato `EXP-YYYYMMDD-0001`
*   **Sin nombre manual:** Ya no es necesario ingresar un nombre, el radicado es el identificador único
*   **Creación atómica:** Expediente + documento en una sola transacción con rollback automático
*   **Opciones de documento:** Crear nuevo, relacionar existente, o crear expediente vacío
*   **Soporte múltiple:** Electrónico, Físico o Híbrido

### 2. Simplificación de Menú y Permisos
*   **Eliminado:** El menú "Captura de documentos" ya no existe como módulo separado
*   **Unificado:** La creación de documentos se realiza únicamente dentro del wizard de expedientes
*   **Permisos coherentes:**
    *   `expedientes_crear` → Crear expediente + documentos dentro del wizard
    *   `expedientes_agregar_documentos` → Relacionar documentos existentes

### 3. Validación de Duplicados en Tiempo Real
*   Campos personalizados con **validación automática de duplicidad** por oficina
*   **Modal de Alerta:** Muestra expediente existente si se detecta duplicado
*   **Anexión Inteligente:** Permite anexar documentos a expediente duplicado

### 4. Historial de Anexos por Coincidencia
*   Nueva tabla `expediente_anexos_historial` para trazabilidad de anexos

### 5. Crear Documento Nuevo en Detalle de Expediente
*   **Nuevo botón:** "📄 Crear Documento Nuevo" en la vista de expediente
*   **Protegido por permiso:** Solo visible para usuarios con `expedientes_crear`
*   **Formulario completo:** Tipo de soporte, asunto, ubicación física, archivo (drag & drop)
*   **Creación y vinculación automática:** El documento se crea y añade al expediente en una transacción
*   **Nuevo endpoint:** `POST /documentos/con-expediente`
*   **Diseño consistente:** Usa el componente `FileUpload` con estilo drag & drop

### 6. Edición de Ubicación Física de Documentos
*   **Edición en línea:** Permite modificar la ubicación física (Carpeta, Caja, Estante, etc.) de un documento desde el listado.
*   **Permiso requerido:** `expedientes_editar`. This was chosen as the most relevant existing permission.
*   **Validación de Carpeta:** Al cambiar de carpeta, se valida capacidad y estado.
*   **Modal dedicado:** Interfaz clara para gestionar la ubicación física.

---

## 🛠️ Mejoras y Correcciones

### Estados Vacíos en Tablas
*   **Gestión de Préstamos:** Nuevo diseño con mensaje claro cuando no hay préstamos activos
*   Estilos CSS `.empty-state` para estados vacíos informativos

### Reportes y Trazabilidad
- **Optimización FUID**: Se optimizó la consulta SQL del reporte FUID para incluir filtros por oficina, serie y rango de fechas de manera eficiente.
- **Corrección Trazabilidad**: Se solucionaron errores en la consulta de trazabilidad de expedientes (`ER_BAD_FIELD_ERROR`) corrigiendo nombres de columnas y eliminando referencias a campos inexistentes.

### Visibilidad de Metadatos (Global) - [BUG FIX]
*   Campos personalizados visibles para cualquier usuario con acceso al expediente
*   Corrección de error 403 para usuarios sin roles administrativos
*   Nuevo componente `MetadatosExpediente.js`

### Iconos del Menú de Usuario - [BUG FIX]
*   **Corregido:** Iconos de "Perfil" y "Cerrar sesión" mostraban placeholders rotos
*   **Solución:** Reemplazo de emojis por iconos SVG inline en `UserDropdown.js`

---

## 📑 Cambios Técnicos

### Backend
*   Nuevo endpoint `POST /expedientes/crear-completo` con soporte multipart
*   **Nuevo endpoint `POST /documentos/con-expediente`** para crear documento y vincularlo a expediente
*   Función `crearExpedienteCompleto()` en `expediente.service.js`
*   Nueva función `generarRadicadoExpediente()` en `radicado.util.js` (formato EXP-YYYYMMDD-0001)
*   Nueva función `createDocumentoConExpediente()` en `documento.controller.js`
*   Transacciones atómicas con `withTransaction` utility
*   Permisos simplificados en controller
*   **Corrección:** Validación actualizada para no requerir nombre de expediente (auto-generado)
*   **Nuevo:** Carpeta automática 1:1 con expediente — cada expediente genera una carpeta única al crearse
*   **Nuevo:** Auto-asignación de carpeta en `createDocumentoConExpediente` — si el expediente no tiene carpeta, se crea automáticamente (bajo demanda)
*   **Nuevo:** Query `getDocumentoById` incluye JOIN doble a `carpetas` (por documento y por expediente) con COALESCE para herencia de ubicación

### Frontend
*   Nuevo componente `WizardCrearExpediente.js` (4 pasos, sin campo de nombre)
*   Integración del wizard en `GestionExpedientes.js`
*   **Nuevo formulario en `AccionesProductor.js`:** "Crear Documento Nuevo" con PermissionGuard
*   **Componente `FileUpload`:** Reutilizado para drag & drop consistente
*   Eliminado menú "Captura de documentos" en `Sidebar.js`
*   Estilos CSS para wizard y estados vacíos en `Dashboard.css`
*   **Nuevo:** `DocumentoDetalle.js` muestra ubicación desde carpeta del expediente con tarjetas visuales

### Base de Datos
*   Índices optimizados en `expediente_datos_personalizados`
*   **Nueva migración:** `2026_02_09_deprecate_documentos_crear.sql`
*   **Nueva migración:** `20260210_fix_remitente_null.sql` — Campos remitente opcionales
*   **Nueva migración:** `20260210_link_carpetas_expedientes.sql` — Columna `id_expediente` en tabla `carpetas`
*   **Nueva migración:** `20260210_carpeta_unica_expediente.sql` — Constraint UNIQUE en `carpetas.id_expediente` (relación 1:1)
*   **Modelo de datos:** Expediente → Carpeta (1:1, UNIQUE) → Ubicación (paquete, tomo, estante, entrepaño, módulo, otro)

---

## ⚠️ Cambios de Permisos

### Permiso Deprecado: `documentos_crear`
El permiso `documentos_crear` (ID: 102) ha sido **deprecado** y reemplazado por `expedientes_crear`.

| Antes (v1.3.2) | Ahora (v1.3.3) |
|----------------|----------------|
| `documentos_crear` → Capturar documentos | `expedientes_crear` → Crear expediente + documentos |
| Menú "Captura de documentos" separado | Integrado en wizard de expedientes |

**Acción requerida:** Ejecutar la migración SQL para marcar el permiso como deprecado:
```sql
UPDATE permisos 
SET descripcion = '[DEPRECADO v1.3.3] Usar expedientes_crear...'
WHERE nombre_permiso = 'documentos_crear';
```

### Permisos Activos para Gestión Documental
| Permiso | Función |
|---------|---------|
| `expedientes_crear` | Crear expediente + documentos nuevos |
| `expedientes_agregar_documentos` | Vincular documentos existentes |
| `documentos_ver` | Ver lista de documentos |
| `documentos_firmar` | Firmar documentos |
| `documentos_workflow` | Iniciar/avanzar workflows |


---

## 📦 Nuevas Funcionalidades (Gestión Física Avanzada) - v1.3.3-plus

### 6. Gestión de Cajas y Ubicación Física
*   **Nuevo módulo "Gestión de Cajas":** Crear, listar y editar cajas físicas para almacenamiento.
*   **Capacidad Controlada:** Definir capacidad máxima de carpetas por caja.
*   **Ubicación Heredada:** Las carpetas heredan automáticamente la ubicación (Estante, Entrepaño, Módulo) de su caja asignada.
*   **Contador Automático:** Visualización en tiempo real de la ocupación de cada caja (ej: 5/10 carpetas).
*   **Validación de Capacidad:** El sistema impide agregar carpetas a una caja llena.

### 7. Detección Inteligente de Duplicados en Expedientes
*   **Prevención de Duplicidad:** El sistema valida en tiempo real si ya existe un expediente con los mismos metadatos clave (ej: N° de Documento, Radicado Externo).
*   **Modal de Acción:** Si se detecta un duplicado al intentar crear, se ofrece un modal con opciones claras:
    *   **Ver Expediente:** Ir directamente al expediente existente.
    *   **Anexar Documento:** Crear el documento y adjuntarlo automáticamente al expediente existente.
    *   **Relacionar:** Vincular documentos ya cargados al expediente existente.

### 8. Ubicación Física Estructurada para Documentos
*   **Campos Detallados:** Reemplazo del campo de texto libre por estructura jerárquica:
    *   `Carpeta` (Seleccionable)
    *   `Paquete/Caja`
    *   `Tomo/Legajo`
    *   `Módulo`, `Estante`, `Entrepaño`
*   **Autocompletado:** Al seleccionar una `Carpeta` en el formulario de creación, todos los campos de ubicación se completan automáticamente según la caja donde reside la carpeta.
*   **Flexibilidad:** Permite ajustar manualmente "Tomo" u "Otro" para casos especiales.
*   **Integración:** Disponible tanto en el Wizard de Creación como en "Añadir Documento" dentro del expediente.

### 9. Creación Automática de Carpetas en Expedientes
*   **Automatización Total:** Al crear **cualquier** expediente, el sistema crea automáticamente una carpeta con número único consecutivo (1, 2, 3...).
*   **Formato Numérico Simple:** El código de carpeta es un número consecutivo global, sin prefijos ni fechas.
*   **Relación 1:1:** Cada expediente tiene exactamente una carpeta (constraint UNIQUE en `carpetas.id_expediente`).
*   **Herencia en Documentos:** Al añadir documentos al expediente, la carpeta se asigna automáticamente.
*   **Bajo Demanda:** Para expedientes legacy sin carpeta, se crea automáticamente al añadir un documento.
*   **Eficiencia:** Reduce el proceso de creación de 3 pasos (Crear Carpeta → Crear Expediente → Vincular) a cero pasos manuales.

### 10. Correcciones de Errores Críticos (2026-02-10)

#### 10.1 Validación de Ubicación Física Corregida
*   **Problema:** Al crear documentos físicos/híbridos con campos estructurados (Paquete, Estante, Tomo, etc.) pero sin seleccionar una Carpeta, el sistema rechazaba la solicitud con el error *"Debe especificar la ubicación física"*.
*   **Solución:** La validación ahora acepta **cualquier** campo de ubicación como válido (Carpeta, Paquete, Estante, Tomo, Módulo, Entrepaño u Otro).
*   **Archivos modificados:**
    *   `documento.controller.js` (Backend - `createDocumento` y `createDocumentoConExpediente`)
    *   `AccionesProductor.js` (Frontend)
    *   `CapturaDocumento.js` (Frontend)

#### 10.2 Campos de Remitente Opcionales
*   **Problema:** La base de datos exigía `remitente_nombre` como campo obligatorio (`NOT NULL`), causando el error *"Column 'remitente_nombre' cannot be null"* al crear documentos internos sin remitente externo.
*   **Solución:** Migración para hacer opcionales los campos `remitente_nombre`, `remitente_identificacion` y `remitente_direccion`.
*   **Migración:** `20260210_fix_remitente_null.sql`

#### 10.3 Referencia a Tabla Inexistente Corregida
*   **Problema:** El endpoint `createDocumentoConExpediente` referenciaba la tabla `indice_electronico` (inexistente), causando error SQL al vincular documentos a expedientes.
*   **Solución:** Corregida la referencia a la tabla correcta `expediente_documentos` y la columna `orden_foliado` en lugar de `folio`.
*   **Archivo modificado:** `documento.controller.js`

#### 10.4 Asignación Automática de Carpeta a Documentos
*   **Problema:** Al crear documentos dentro de un expediente que ya tenía carpeta, el documento quedaba sin `id_carpeta` y mostraba *"Sin ubicación física registrada"*.
*   **Solución:** `createDocumentoConExpediente` ahora busca automáticamente la carpeta vinculada al expediente (vía `carpetas.id_expediente`) y la asigna al documento si no se seleccionó manualmente.
*   **Archivo modificado:** `documento.controller.js`

#### 10.5 Carpeta Automática para TODOS los Expedientes
*   **Problema:** La creación automática de carpeta solo ocurría cuando el usuario marcaba el checkbox "Crear carpeta automáticamente" y solo para documentos físicos.
*   **Solución:** Ahora **toda** creación de expediente genera una carpeta automáticamente con número consecutivo simple (1, 2, 3...). También se crea bajo demanda al añadir documentos a expedientes legacy.
*   **Archivos modificados:** `expediente.service.js`, `documento.controller.js`
*   **Migraciones:**
    *   `20260210_link_carpetas_expedientes.sql` — Columna `id_expediente` en `carpetas`
    *   `20260210_carpeta_unica_expediente.sql` — Constraint UNIQUE (relación 1:1)

#### 10.6 Detalle de Documento: Visualización de Ubicación Estructurada
*   **Problema:** La vista de detalle del documento solo leía el campo de texto legacy `ubicacion_fisica`, que estaba vacío para documentos creados con campos estructurados.
*   **Solución:** `DocumentoDetalle.js` muestra tarjetas visuales para cada campo estructurado. La **Carpeta** se muestra como número simple (ej: `3`). La ubicación se hereda desde la carpeta del expediente si el documento no tiene datos propios.
*   **Archivos modificados:**
    *   `DocumentoDetalle.js` (Frontend)
    *   `documento.controller.js` (Backend - JOIN doble a `carpetas` con COALESCE)

#### 10.7 Formato de Código de Carpeta Simplificado
*   **Problema:** El código de carpeta usaba formato largo `OFC-5-2026-001`, difícil de identificar rápidamente.
*   **Solución:** Cambiado a consecutivo numérico global simple: `1`, `2`, `3`... Las carpetas existentes fueron migradas al nuevo formato.
*   **Archivo modificado:** `carpeta.service.js` (`crearCarpeta`)

### 11. Sistema de Paquetes (Nuevo Módulo)

#### 11.1 Gestión Global de Paquetes
*   **Nuevo módulo global:** Administración centralizada de paquetes para todo el sistema (independiente de la oficina).
*   **Tabla de base de datos:** `paquetes` (numero_paquete, estado, expedientes_actuales, fecha_creacion, fecha_cierre, observaciones). **Nota:** `id_oficina` ahora es NULL para paquetes globales.
*   **Columna:** `id_paquete` en tabla `expedientes` (FK a `paquetes`).
*   **Numeración simple:** Los paquetes se numeran secuencialmente de forma única en todo el sistema: `1`, `2`, `3`...
*   **Migración:** `20260211_global_paquetes.sql`

#### 11.2 Backend de Paquetes
*   **Nuevo servicio:** `paquete.service.js` con funciones globales:
    *   `obtenerPaqueteActivo()` — Obtiene o crea el único paquete activo del sistema.
    *   `crearPaquete()` — Crea paquete con número consecutivo global.
    *   `asignarExpediente(id_expediente, id_paquete, marcar_lleno)` — Asigna expediente con opción de cerrar paquete.
    *   `marcarLleno(id_paquete)` — Cierra paquete y crea el siguiente automáticamente.
    *   `reabrirPaquete(id_paquete)` — Reabre paquete (validando que no haya otro activo).
    *   `listarPaquetes()` — Listado paginado de todos los paquetes.
    *   `obtenerExpedientesPaquete(id_paquete)` — Expedientes dentro de un paquete.
*   **Nuevo controller:** `paquete.controller.js`
*   **Nuevas rutas:** `paquete.routes.js` registradas en `/api/paquetes`
*   **Auditoría:** Todas las acciones de paquete se registran en la tabla `auditoria`.

#### 11.3 Asignación Automática de Paquetes
*   **Al crear expediente:** Se asigna automáticamente al paquete activo global.
*   **Si no existe paquete:** Se crea uno nuevo automáticamente.
*   **Doble punto de asignación:** Funciona tanto en `crearExpedienteCompleto` (servicio) como en `createExpediente` (controller).
*   **Archivos modificados:** `expediente.service.js` (Paso 3.6), `expediente.controller.js`

#### 11.4 Frontend de Paquetes
*   **Nuevo componente:** `GestionPaquetes.js` — Vista de administración con:
    *   Listado global de todos los paquetes del sistema.
    *   Expandir para ver expedientes del paquete.
    *   Acciones: Marcar como lleno, Reabrir.
    *   Botón **"+ Verificar Paquete Activo"** para gestión automática.
    *   Paginación y badges de estado (Activo/Lleno).
*   **Nuevo componente:** `PaqueteAsignacion.js` — Integrado en detalle de expediente:
    *   Muestra paquete activo global.
    *   Botón para asignar manualmente.
    *   Modal para marcar paquete como lleno al asignar.
*   **Sidebar:** Nuevo enlace "📦 Paquetes" en sección Gestión Documental.
*   **Ruta:** `/paquetes` en `App.js`.

#### 11.5 Ubicación Física en Índice Electrónico
*   **Mejora:** La columna "Ubicación Física" del índice de documentos ahora muestra:
    *   📁 **Carpeta:** Número de carpeta del expediente
    *   📦 **Paquete:** Número de paquete asignado
    *   📍 Ubicación física del documento (si existe)
*   **Archivo modificado:** `IndiceDocumentos.js`

#### 11.6 Terminología Unificada: "Paquete" reemplaza "Caja"
*   **Renombrado global:** Todas las etiquetas "Paquete / Caja" y "Caja" cambiadas a "Paquete".
*   **Archivos actualizados:**
    *   `AccionesProductor.js` — Labels y placeholders
    *   `CapturaDocumento.js` — Labels, placeholders y selects
    *   `WizardCrearExpediente.js` — Labels, placeholders, resumen y validaciones
    *   `DocumentoDetalle.js` — Label de ubicación

#### 11.7 Simplificación de UI en Documentos
*   **Eliminación de campo manual:** Se retiró el campo de texto "Paquete" del formulario de creación de documentos (`AccionesProductor.js`). La asignación de paquete es ahora 100% automática o heredada de la carpeta.
*   **Limpieza de Detalle:** Se ajustó la vista de detalle del documento para priorizar la información de ubicación estructurada.

### 12. Navegación Mejorada

#### 12.1 Botón "Volver al Listado" en Detalle de Expediente
*   **Nuevo:** Botón "← Volver al listado" en la parte superior del detalle del expediente.
*   **Navegación:** Redirige a `/dashboard/expedientes` para continuar consultando la lista.
*   **Archivo modificado:** `ExpedienteDetalle.js`

### 13. Optimización de Retención Documental (Épica 5)

#### 13.1 Nuevos Estados y Fases de Retención
*   **Estados ampliados:** Se agregan `Histórico` y `Eliminable` al ciclo de vida del expediente.
*   **Fases automáticas:** Nueva columna `fase_retencion` que calcula en qué etapa está el expediente: `Vigente`, `En Gestión`, `En Central`, `Histórico` o `Eliminable`.
*   **Fechas precalculadas:** El sistema calcula automáticamente `fecha_inicio_retencion`, `fecha_fin_gestion` y `fecha_fin_central` basado en la TRD (Serie/Subserie).

#### 13.2 Automatización con Cron Job
*   **Job Diario:** Nuevo proceso automático (`retencion.job.js`) que corre cada noche (2:00 AM) y al iniciar el servidor.
*   **Recálculo masivo:** Actualiza fases y estados de todos los expedientes automáticamente.
*   **Alertas Preventivas:** Genera alertas 30 días antes de que un expediente cambie de fase (ej: "Próximo a vencer en Gestión").

#### 13.3 Dashboard de Retención Mejorado
*   **Nuevo Módulo:** Vista centralizada `RetencionDocumental.js` con:
    *   **Tarjetas de Resumen:** Contadores visuales por fase (Vigente, Gestión, Central, Histórico, Eliminable).
    *   **Alertas Activas:** Lista de expedientes con alertas no leídas y fecha límite.
    *   **Próximos Cambios:** Tabla de expedientes que cambiarán de fase en los próximos 30 días.
    *   **Pestañas:** Dashboard, Por Oficina, Pendientes, Historial.
*   **Acciones:** Procesar (Conservar/Eliminar), Transferir a Central, Ejecutar Job Manualmente.

---

### 14. Reporte FUID Optimizado (Épica 4)

#### 14.1 Rendimiento y Optimización SQL
*   **Consulta Ultrarrápida:** Nueva ingeniería de consultas SQL que reduce el tiempo de generación de reportes de >2s a **<200ms**.
*   **Eliminación de Subconsultas:** Se reemplazaron subconsultas correlacionadas por `LEFT JOIN` optimizados.

#### 14.2 Nuevos Campos en FUID
*   **Ubicación Física Detallada:** Ahora muestra la ruta exacta (ej: `Paquete 5 / Carpeta 20`).
*   **Información de Retención:** Incluye fase actual y fechas de vencimiento (ej: `En Gestión (Vence: 2028-10-10)`).
*   **Soporte Documental:** Columna estandarizada.

#### 14.3 Trazabilidad y Seguridad
*   **Timeline del Expediente:** Nuevo botón "🕒 Trazabilidad" en el reporte FUID.
*   **Historial Completo:** Muestra todos los eventos del ciclo de vida (creación, cierre, préstamos, eliminación) en una línea de tiempo visual.
*   **Auditoría:** Integración directa con log de auditoría del sistema.

#### 14.4 Exportación Asíncrona
*   **PDF y Excel Asíncronos:** La generación de archivos ahora ocurre en segundo plano sin bloquear la interfaz.
*   **Barra de Progreso:** Feedback visual durante la exportación.
*   **Formato Inteligente:** El PDF ajusta automáticamente su orientación (Vertical/Horizontal) según la cantidad de metadatos.


### 15. Mejoras en Reporte FUID (v1.3.3 - Update 2)

#### 15.1 Filtros Avanzados y Paginación
*   **Nuevos Filtros:** Se agregaron filtros por **Serie/Subserie**, **Fecha Inicial** y **Fecha Final** para generar reportes específicos.
*   **Paginación Backend:** Implementada paginación en el servidor (50 registros por página) para mejorar el rendimiento con grandes volúmenes de datos.
*   **Exportación Total:** Las opciones de exportar a **Excel** y **PDF** ahora descargan **todos** los registros filtrados, no solo la página actual visible.

#### 15.2 Visualización de Campos Personalizados
*   **Columnas Dinámicas:** La tabla del FUID ahora detecta automáticamente si los expedientes tienen campos personalizados (Metadata) y agrega las columnas correspondientes (ej: "N° Documento", "Nombre Paciente").
*   **Datos en Tabla:** Los valores de estos campos se visualizan directamente en la grilla del reporte.

---

### 16. Corrección de Errores (Bug Fixes)

#### 16.1 Trazabilidad del Expediente
*   **Error SQL Corregido:** Se solucionó el error `Unknown column 'a.entidad'` y problemas de sintaxis en la consulta de trazabilidad.
*   **Filtro por Detalle:** La trazabilidad ahora busca eventos en el log de auditoría filtrando por el contenido del detalle (ej: "Expediente con ID..."), asegurando que se muestre todo el historial.
*   **Columnas Incorrectas:** Se corrigieron referencias a columnas inexistentes (`id_rol` → `rol_id`, `id_usuario` → `usuario_id`) en la base de datos.

#### 16.2 Frontend Warnings
*   **Linting:** Se corrigieron advertencias de React (`Expected '==='`) para mejorar la estabilidad del código.

### 17. Limpieza de Módulos
*   **Módulo Eliminado:** Se eliminó el módulo `GestionEliminacion` y su enlace en el menú lateral.
*   **Razón:** La funcionalidad de eliminación de expedientes ha sido centralizada y mejorada en el nuevo módulo de **Retención Documental**.

---

### 18. Mejoras en Filtros de Expedientes
*   **Búsqueda por Rango de Fechas:** Nuevos campos "Fecha Apertura (Desde)" y "Fecha Apertura (Hasta)" en el panel de filtros.
*   **Búsqueda en Metadatos:** Nuevo campo "Buscar en Campos Personalizados" que permite filtrar expedientes por valores específicos de sus metadatos.
*   **Limpieza de Filtros Mejorada:** El botón "Limpiar filtros" ahora restablece todos los criterios de búsqueda, incluyendo fechas y metadatos.

### 19. Edición Avanzada de Ubicación Física (Documentos)
*   **Edición en Línea:** Nueva funcionalidad en el Índice Electrónico para modificar la ubicación física de un documento ya radicado.
*   **Campos Editables:** Permite actualizar Carpeta, Paquete/Caja, Tomo, Módulo, Estante, Entrepaño y Notas (Otro).
*   **Validación de Carpeta:** Al cambiar la carpeta de un documento, el sistema valida automáticamente la capacidad y estado de la nueva carpeta.
*   **Permisos:** Funcionalidad protegida por el permiso `documentos_editar`. El botón de edición se oculta automáticamente si el usuario no tiene este permiso, alineándose con la configuración de roles.
*   **Componentes:** Nuevo modal `EditLocationModal.js` y botón de edición (✏️) en `IndiceDocumentos.js`.

---


## 📋 Resumen de Archivos Nuevos (v1.3.3)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `paquete.service.js` | Backend | Lógica de negocio de paquetes |
| `paquete.controller.js` | Backend | Endpoints de la API de paquetes |
| `paquete.routes.js` | Backend | Rutas `/api/paquetes/*` |
| `GestionPaquetes.js` | Frontend | Vista de administración de paquetes |
| `PaqueteAsignacion.js` | Frontend | Componente de asignación en detalle |
| `20260210_paquetes.sql` | Migración | Tabla `paquetes` + columna `id_paquete` |
| `retencion.job.js` | Backend Job | Proceso Cron para cálculo de fases |
| `retencion.controller.js` | Backend | Endpoints dashboard y alertas (rewritten) |
| `retencion.routes.js` | Backend | Nuevas rutas dashboard/alertas/job |
| `RetencionDocumental.js` | Frontend | Dashboard con tarjetas y fases |
| `20260210_retencion_optimizacion.sql` | Migración | Schema de retención (5 columnas + alertas) |
| `EditLocationModal.js` | Frontend | Modal para editar ubicación física de documentos |

---
*Documevi SGDEA - Gestión Documental Avanzada*
