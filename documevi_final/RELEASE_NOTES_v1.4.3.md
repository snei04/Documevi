# Release Notes - v1.4.3 🚀

**Fecha de lanzamiento:** 25 de febrero de 2026

## Resumen de la Versión
Esta versión incluye mejoras significativas en la gestión de módulos de parametrización (campos personalizados, workflows y plantillas), añadiendo capacidades de edición y eliminación con control de permisos granular. También mejora la experiencia de búsqueda de paquetes, la detección de duplicados con información de ubicación física, e incorpora un módulo de **Carga Masiva** para migración de expedientes físicos.

---

## 🆕 Nuevas Funcionalidades y Mejoras

### 1. Ubicación Física en Detección de Duplicados
*   **Contexto Ampliado:** Cuando el sistema detecta que ya existe un expediente con el mismo número de documento (o cualquier otro campo personalizado de validación), el modal de alerta "Expediente Existente Detectado" ahora muestra la ubicación física exacta del expediente.
*   **Nuevos Datos Visibles:**
    *   📦 **Paquete:** Número de paquete donde se encuentra el expediente.
    *   📁 **Carpeta:** Código de la carpeta específica.
*   **Beneficio:** Permite al usuario u operario de archivo saber exactamente dónde buscar físicamente el documento original sin tener que navegar fuera del flujo de creación/anexión.

### 2. Búsqueda y Navegación Mejorada en Paquetes
*   **🔍 Barra de Búsqueda:** Se añadió un campo de texto para filtrar paquetes por número con debounce de 400ms para evitar llamadas excesivas a la API.
*   **⏮⏭ Navegación Rápida:** Nuevos botones "Inicio" y "Final" en la paginación para saltar directamente a la primera o última página.
*   **✕ Botón Limpiar:** Permite limpiar la búsqueda con un solo clic.

### 3. Edición y Eliminación de Campos Personalizados
*   **✏️ Editar Campo:** Edición inline directamente en la tabla (nombre, tipo, obligatoriedad, validar duplicidad).
*   **🗑️ Eliminar Campo:** Eliminación con modal de confirmación que advierte sobre la pérdida de datos en expedientes.
*   **🔒 Control de Permisos:**
    *   `campos_editar` — Requerido para editar campos personalizados.
    *   `campos_eliminar` — Requerido para eliminar campos personalizados.
    *   `campos_crear` — Requerido para ver el formulario de creación.

### 4. Edición y Eliminación de Workflows y sus Pasos
*   **✏️ Editar Workflow:** Edición inline de nombre y descripción del workflow.
*   **🗑️ Eliminar Workflow:** Eliminación con modal de confirmación. No permite eliminar si hay documentos asociados.
*   **✏️ Editar Paso:** Edición inline de orden, nombre, rol responsable y requisito de firma.
*   **🗑️ Eliminar Paso:** Eliminación con modal de confirmación.
*   **🔒 Control de Permisos:**
    *   `workflows_crear` — Requerido para crear workflows y pasos.
    *   `workflows_editar` — Requerido para editar workflows y pasos.
    *   `workflows_eliminar` — Requerido para eliminar workflows y pasos.

### 5. Edición y Eliminación de Plantillas y sus Campos
*   **✏️ Editar Plantilla:** Edición inline de nombre y descripción de la plantilla.
*   **🗑️ Eliminar Plantilla:** Eliminación con modal de confirmación que advierte sobre la pérdida de campos y diseños.
*   **✏️ Editar Campo:** Edición inline de orden, nombre y tipo del campo de plantilla.
*   **🗑️ Eliminar Campo:** Eliminación con modal de confirmación.
*   **🔒 Control de Permisos:**
    *   `plantillas_crear` — Requerido para crear nuevas plantillas.
    *   `plantillas_editar` — Requerido para editar plantillas y sus campos.
    *   `plantillas_eliminar` — Requerido para eliminar plantillas y sus campos.

### 6. Módulo de Carga Masiva de Expedientes (Migración)
*   **📤 Carga por Excel:** Nuevo módulo de administración que permite importar expedientes masivamente desde un archivo Excel.
*   **📥 Plantilla Dinámica:** Descarga una plantilla Excel generada automáticamente según la oficina seleccionada, incluyendo columnas base, campos personalizados, ubicación física y documentos.
*   **📅 Fechas y Estado del Expediente:**
    *   `fecha_apertura (*)` — Fecha de apertura del expediente **(Obligatorio)**. Formato: AAAA-MM-DD.
    *   `fecha_cierre` — Fecha de cierre del expediente (Opcional). Formato: AAAA-MM-DD.
    *   `estado_expediente` — Fase del archivo. Valores permitidos:
        *   `En trámite` — Expediente activo (valor por defecto si se deja vacío).
        *   `Cerrado en Gestión` — Expediente en archivo de gestión.
        *   `Cerrado en Central` — Expediente transferido a archivo central.
*   **✅ Validaciones:**
    *   Validación de formato de fechas (AAAA-MM-DD).
    *   Validación de coherencia: la fecha de cierre no puede ser anterior a la de apertura.
    *   Validación de estado contra valores permitidos.
    *   Validación de campos personalizados obligatorios.
*   **📊 Resultados Detallados:** Después de la carga, se muestra un resumen con conteo de filas exitosas/fallidas y detalle por fila con radicado generado o error específico.

### 7. Mejoras de Navegación y Limpieza
*   **🗑️ Ruta Eliminada:** Se eliminó la ruta `/dashboard/captura` (`CapturaDocumento`) que no correspondía a ninguna funcionalidad existente.
*   **🔗 Enlace Corregido:** La tarjeta "Documentos Capturados" en el Dashboard ahora redirige a `/dashboard/expedientes` en lugar de la ruta inexistente.
*   **📜 Scroll en Sidebar:** Se agregó barra de desplazamiento vertical al menú lateral para que todos los elementos sean accesibles cuando exceden la altura de la pantalla, con scrollbar personalizada acorde al diseño.

---

## 📑 Cambios Técnicos

### Backend

#### Servicio de Validación de Duplicados
*   **Archivo:** `validacionDuplicados.service.js`
*   Se optimizó la consulta SQL agregando `LEFT JOIN` a las tablas `paquetes` y `carpetas` para recuperar `numero_paquete` y `codigo_carpeta`.

#### Gestión de Paquetes
*   **Archivos:** `paquete.service.js`, `paquete.controller.js`
*   Se añadió soporte para el parámetro `search` que filtra paquetes por `numero_paquete` usando `LIKE`.

#### Campos Personalizados
*   **Archivos:** `campo_personalizado.controller.js`, `campo_personalizado.routes.js`
*   Se expusieron las rutas `PUT /:id` y `DELETE /:id` con los permisos `campos_editar` y `campos_eliminar`.
*   Se actualizó `updateCampo` para incluir el campo `validar_duplicidad` en la consulta UPDATE.

#### Workflows
*   **Archivos:** `workflow.controller.js`, `workflow.routes.js`
*   Se crearon 4 nuevos controladores: `updateWorkflow`, `deleteWorkflow`, `updateWorkflowPaso`, `deleteWorkflowPaso`.
*   Se expusieron rutas PUT/DELETE para workflows (`/:id`) y pasos (`/:id/pasos/:id_paso`).
*   `deleteWorkflow` valida que no existan documentos asociados antes de eliminar.

#### Plantillas
*   **Archivos:** `plantilla.controller.js`, `plantilla.routes.js`
*   Se crearon 4 nuevos controladores: `updatePlantilla`, `deletePlantilla`, `updateCampoPlantilla`, `deleteCampoPlantilla`.
*   Se expusieron rutas PUT/DELETE para plantillas (`/:id`) y campos (`/:id/campos/:id_campo`).

#### Carga Masiva (Migración)
*   **Archivos:** `migracion.controller.js`, `migracion.routes.js`
*   **Plantilla Excel (`generarPlantillaEjemplo`):** Genera dinámicamente un Excel con columnas base (`id_serie`, `id_subserie`, `descriptor_1`, `descriptor_2`), fechas (`fecha_apertura`, `fecha_cierre`), estado (`estado_expediente`), campos personalizados de la oficina, ubicación física (`numero_paquete`, `codigo_carpeta`) y documento adjunto (`DOC_*`).
*   **Carga Masiva (`cargarMasivo`):** Procesa cada fila del Excel validando: serie obligatoria, fecha de apertura obligatoria con formato correcto, fecha de cierre opcional con validación de coherencia, estado del expediente contra valores enum permitidos, campos personalizados obligatorios. Cada expediente se crea transaccionalmente con radicado auto-generado.
*   **Rutas:**
    *   `GET /api/migracion/plantilla/:id_oficina` — Descarga plantilla. Requiere `expedientes_crear`.
    *   `POST /api/migracion/cargar/:id_oficina` — Carga archivo. Requiere `expedientes_crear`.
*   **Dependencias:** Librería `xlsx` para lectura/escritura de archivos Excel.

### Frontend

#### Componentes Modificados
| Componente | Cambios |
|---|---|
| `DuplicadoAlertModal.js` | Sección "Ubicación Física" con Paquete y Carpeta |
| `GestionPaquetes.js` | Barra de búsqueda con debounce, botones Inicio/Final en paginación |
| `GestionCamposPersonalizados.js` | Botones editar/eliminar con PermissionGuard, modal de confirmación |
| `GestionWorkflows.js` | Edición inline, eliminación con modal, PermissionGuard |
| `WorkflowDetalle.js` | Edición/eliminación inline de pasos, botón "Volver al listado" |
| `GestionPlantillas.js` | Edición inline, eliminación con modal, PermissionGuard |
| `PlantillaDetalle.js` | Edición/eliminación inline de campos, botón "Volver al listado" |
| `CargaMasiva.js` | Nuevo componente: selección de oficina, descarga de plantilla, carga de archivo Excel, panel de instrucciones con fechas/estado, resultados detallados |
| `DashboardHome.js` | Enlace "Documentos Capturados" redirige a `/dashboard/expedientes` en lugar de `/dashboard/captura` |
| `App.js` | Eliminada ruta `/dashboard/captura` e importación de `CapturaDocumento` |
| `Dashboard.css` | Sidebar con `overflow-y: auto` y scrollbar personalizada semitransparente |
| `DashboardLayout.js` | Versión actualizada a v1.4.3 |

### Permisos Utilizados (ya existentes en BD)
| Permiso | ID | Descripción |
|---|---|---|
| `campos_editar` | 345 | Editar campos personalizados |
| `campos_eliminar` | 346 | Eliminar campos personalizados |
| `workflows_editar` | 360 | Editar workflows existentes |
| `workflows_eliminar` | 361 | Eliminar workflows |
| `plantillas_editar` | 365 | Editar plantillas existentes |
| `plantillas_eliminar` | 367 | Eliminar plantillas |

> ⚠️ **Nota:** Asegúrese de que los roles correspondientes tengan asignados estos permisos para que los usuarios puedan ver los botones de editar y eliminar.

---
*Documevi SGDEA - Gestión Documental Avanzada*
