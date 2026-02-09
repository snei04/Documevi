# Release Notes - v1.3.3 🚀

## Resumen de la Versión
Esta versión introduce una potente validación de duplicidad basada en campos personalizados y mejora significativamente la visibilidad de la información clave del expediente para todos los roles autorizados, corrigiendo errores críticos de permisos identificados en producción.

---

## 🆕 Nuevas Funcionalidades

### 1. Validación de Duplicados en Tiempo Real
*   Ahora es posible marcar campos personalizados (como Cédula o Historia Clínica) para **validación automática de duplicidad** por oficina.
*   **Modal de Alerta:** Si se detecta un valor duplicado durante la creación de un expediente, el sistema muestra una alerta clara con el expediente existente.
*   **Anexión Inteligente:** Permite anexar documentos directamente a un expediente existente detectado como duplicado, manteniendo la trazabilidad.

### 2. Historial de Anexos por Coincidencia
*   Nueva tabla `expediente_anexos_historial` para registrar cuándo y por qué un documento fue anexado a un expediente debido a un dato de duplicidad.
*   Incluye detalles del campo que generó la coincidencia, el valor y observaciones del usuario.

### 3. Optimización de Base de Datos
*   Se añadieron índices estratégicos en `expediente_datos_personalizados` y `expedientes`.
*   Búsquedas y validaciones de duplicados ahora funcionan en milisegundos incluso con grandes volúmenes de datos.

---

## 🛠️ Mejoras y Correcciones de Bugs

### Visibilidad de Metadatos (Global) - [BUG FIX]
*   **Corrección:** Se extrajo la visualización de metadatos del panel de "Productor" para que sea global.
*   **Nueva Vista:** Los campos personalizados ahora son visibles para cualquier usuario con acceso al expediente (Auditores, etc.), sin importar el estado del expediente (cerrado o en trámite).
*   **Ajuste de Permisos (403 Fix):** Se corrigió un error que impedía visualizar los nombres de los campos a usuarios sin roles administrativos. Se habilitó el acceso de lectura para usuarios con el permiso `expedientes_ver`.
*   **Componentización:** Se implementó `MetadatosExpediente.js` para estandarizar la visualización de datos en toda la plataforma.

---

## 📑 Cambios Técnicos
*   **Scripts SQL:** Aplicación de migraciones `20260114_validacion_duplicados.sql` y `20260203_fix_validacion_duplicados.sql`.
*   **Backend:** 
    *   Mejora en `authorizePermission.js` para soportar múltiples permisos (OR).
    *   Inclusión de `id_oficina_productora` en el detalle del expediente para optimizar la carga.
    *   Actualización de rutas en `campo_personalizado.routes.js`, `workflow.routes.js` y `plantilla.routes.js`.
*   **Frontend:** 
    *   Refactorización de `ExpedienteDetalle.js` e integración de `DuplicadoAlertModal.js`.
    *   Eliminación de dependencias de `/series` para carga de metadatos.

---
*Documevi SGDEA - Gestión Documental Avanzada*
