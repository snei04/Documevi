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

---

## 🛠️ Mejoras y Correcciones

### Estados Vacíos en Tablas
*   **Gestión de Préstamos:** Nuevo diseño con mensaje claro cuando no hay préstamos activos
*   Estilos CSS `.empty-state` para estados vacíos informativos

### Visibilidad de Metadatos (Global) - [BUG FIX]
*   Campos personalizados visibles para cualquier usuario con acceso al expediente
*   Corrección de error 403 para usuarios sin roles administrativos
*   Nuevo componente `MetadatosExpediente.js`

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

### Frontend
*   Nuevo componente `WizardCrearExpediente.js` (4 pasos, sin campo de nombre)
*   Integración del wizard en `GestionExpedientes.js`
*   **Nuevo formulario en `AccionesProductor.js`:** "Crear Documento Nuevo" con PermissionGuard
*   **Componente `FileUpload`:** Reutilizado para drag & drop consistente
*   Eliminado menú "Captura de documentos" en `Sidebar.js`
*   Estilos CSS para wizard y estados vacíos en `Dashboard.css`

### Base de Datos
*   Índices optimizados en `expediente_datos_personalizados`
*   **Nueva migración:** `2026_02_09_deprecate_documentos_crear.sql`

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
WHERE nombre = 'documentos_crear';
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
*Documevi SGDEA - Gestión Documental Avanzada*
