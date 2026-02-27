# Release Notes - v1.5.3 🚀

**Fecha de lanzamiento:** 27 de febrero de 2026

## Resumen de la Versión
Esta versión introduce la **optimización del flujo de creación de expedientes**, reemplazando el Wizard de 4 pasos por un proceso simplificado de 2 pasos con validación proactiva de duplicidad. Se implementan las reglas de negocio BR-01, BR-02 y BR-03 conforme a las normativas del Archivo General de la Nación (AGN), incluyendo manejo diferenciado de fechas según tipo de soporte, asignación automática de ubicación física, y creación integrada de documento inicial.

---

## 🆕 Nuevas Funcionalidades y Mejoras

### 1. Nuevo Flujo de Creación de Expedientes (2 Pasos)
*   **Antes:** Wizard de 4 pasos (Expediente → Opción Documento → Detalles Documento → Resumen) con validación de duplicidad al final.
*   **Ahora:** Flujo simplificado de 2 pasos con validación proactiva:

    | Paso | Contenido | Acción |
    |------|-----------|--------|
    | **Paso 1 — Clasificación** | Serie, Subserie, Campos Personalizados, Tipo de Soporte | Botón "Validar / Siguiente →" ejecuta validación de duplicidad |
    | **Paso 2 — Detalles** | Asunto, Fechas (condicionales), Ubicación Física (informativo), Primer Documento (opcional), Observaciones | Botón "✓ Crear Expediente" |

### 2. Validación Proactiva de Duplicidad (BR-00)
*   **Ubicación:** La validación ahora se ejecuta al terminar el Paso 1 (antes de ingresar detalles), no al final del formulario.
*   **Beneficio:** El usuario descubre duplicados antes de llenar información adicional, ahorrando tiempo.
*   **Opciones disponibles al detectar duplicado:**
    *   ❌ **Cancelar** — Vuelve al Paso 1 para corregir datos.
    *   📎 **Anexar al Existente** — Redirige al expediente existente para agregar documentos.
    *   ➕ **Crear Nuevo de todas formas** — Avanza al Paso 2 con flag `forzar_creacion` para casos justificados.

### 3. BR-01: Nombre Display Automático del Expediente
*   **Formato:** `[Serie] - [Subserie] - [Primer Campo Personalizado]`
*   **Ejemplo:** `Contratos - Prestación de Servicios - 1018465545`
*   **Radicado:** Se genera automáticamente con formato `EXP-YYYYMMDD-0001` en el campo `codigo_expediente`.
*   **Beneficio:** Elimina la necesidad de inventar nombres manuales; el display es consistente y descriptivo.

### 4. BR-02: Fechas según Tipo de Soporte
*   **Soporte Electrónico:**
    *   Fecha de apertura pre-llenada con la fecha actual del servidor.
    *   Si el usuario la modifica, se muestra una advertencia visual: *"⚠️ Al modificar la fecha automática, se registrará este cambio en el módulo de auditoría"*.
    *   El backend genera un registro `MODIFICACION_FECHA_APERTURA` en la tabla `auditoria` con ambas fechas (servidor e ingresada).
    *   Fecha de cierre no disponible en creación.
*   **Soporte Físico:**
    *   Fecha de apertura y cierre completamente editables (útil para migración de archivos históricos).
    *   Indicación visual: *"📌 Los expedientes físicos permiten fechas manuales"*.

### 5. BR-03: Asignación Automática de Ubicación Física
*   **Solo para Soporte Físico:** El sistema asigna automáticamente:
    *   **Carpeta:** Nueva carpeta con código consecutivo (permite duplicados).
    *   **Paquete:** Asignación al paquete activo global, con incremento automático del contador de expedientes.
*   **Soporte Electrónico:** No se crea carpeta ni se asigna paquete, optimizando recursos.
*   **Feedback al usuario:** Mensaje informativo en el Paso 2 indicando que la asignación es automática.

### 6. Tipo de Soporte en Expedientes
*   **Nueva columna `tipo_soporte`** en la tabla `expedientes` (ENUM: 'Físico', 'Electrónico').
*   **Selección visual:** Selector de tipo radio con iconos (💻 Electrónico / 📄 Físico) con estilos de selección visual dinámicos.
*   **Condicionalidad:** Los campos del Paso 2 varían según el tipo seleccionado en el Paso 1:
    *   Electrónico → Fecha auto-llenada, sin ubicación física.
    *   Físico → Fechas manuales, sección de ubicación física informativa.

### 7. Creación Integrada de Primer Documento
*   **Nuevo:** Al crear un expediente (Físico o Electrónico), el usuario puede opcionalmente incluir un primer documento en la misma acción.
*   **Herencia de tipo de soporte:** El documento hereda automáticamente el tipo de soporte del expediente — no hay selector:
    *   **Expediente Físico → Documento Físico**: Solo se pide el asunto del documento.
    *   **Expediente Electrónico → Documento Electrónico**: Se pide el asunto + archivo adjunto (obligatorio).
*   **Vinculación automática:** El documento se crea con:
    *   Radicado auto-generado (`YYYYMMDD-0001`).
    *   Folio #1 en el expediente.
    *   Carpeta asignada automáticamente (si es Físico).
    *   Serie, subserie y oficina productora heredados del expediente.
*   **Backend:** El endpoint `/crear-completo` ahora acepta tanto JSON (sin documento) como `multipart/form-data` (con documento y archivo adjunto).

### 8. Anexión de Documentos a Expedientes Físicos Cerrados
*   **Regla anterior:** No se permitía anexar documentos a expedientes en estado "Cerrado en Central".
*   **Regla nueva:** Los expedientes con soporte **Físico** permiten anexar documentos incluso si están en estado "Cerrado en Gestión" o "Cerrado en Central". Los expedientes **Electrónicos** cerrados siguen bloqueados.
*   **Auditoría obligatoria:** Cada anexión a expediente cerrado genera un registro `ANEXO_EXPEDIENTE_CERRADO` con:
    *   ID del documento y expediente
    *   Nombre del expediente
    *   Estado al momento de la anexión
    *   Tipo de soporte
    *   Observaciones del usuario
*   **Aplica en:**
    *   Agregar documento existente al expediente (`addDocumentoToExpediente`)
    *   Anexar por duplicado detectado (`anexarDocumentoAExpediente`)

### 9. Edición de Ubicación Física — Campo Paquete/Caja eliminado
*   **Antes:** El modal "Editar Ubicación Física" incluía un campo "Paquete / Caja" editable manualmente.
*   **Ahora:** El campo se eliminó ya que el paquete se asigna automáticamente a nivel del expediente y no debe modificarse por documento individual.
*   **Campos disponibles:** Carpeta, Tomo/Legajo, Estante, Entrepaño, Módulo, Ubicación Literal (Notas), Otro.

---

## 📑 Cambios Técnicos

### Base de Datos

#### Migración: `20260227_optimizar_flujo_expedientes.sql`

| Cambio | Tipo | Descripción |
|--------|------|-------------|
| `tipo_soporte` | ENUM('Físico', 'Electrónico') NOT NULL DEFAULT 'Electrónico' | Nueva columna en `expedientes` |
| `asunto` | TEXT DEFAULT NULL | Descripción/asunto del expediente |
| `observaciones` | TEXT DEFAULT NULL | Notas adicionales |
| `codigo_expediente` | VARCHAR(50) DEFAULT NULL | Radicado auto-generado (EXP-YYYYMMDD-0001) |
| `idx_codigo_expediente` | INDEX | Índice para búsqueda rápida por código |
| `UPDATE tipo_soporte` | DML | Marca como 'Físico' expedientes existentes con `id_paquete` asignado |
| `DROP UNIQUE codigo_carpeta` | DDL | Elimina constraint UNIQUE en `carpetas.codigo_carpeta` permitiendo duplicados |
| `idx_codigo_carpeta` | INDEX | Índice normal (no unique) para búsquedas por código de carpeta |

> ⚠️ **Acción requerida:** Ejecutar la migración **antes** de desplegar el nuevo código:
> ```bash
> mysql -u usuario -p nombre_bd < backend/migrations/20260227_optimizar_flujo_expedientes.sql
> ```

### Backend

#### Servicio de Expedientes
*   **Archivo:** `expediente.service.js`
*   **Función `crearExpedienteCompleto`:** Refactorización completa.
    *   Firma actualizada: `(data, userId, archivo = null)` — acepta archivo opcional.
    *   Implementadas BR-01, BR-02, BR-03 como lógica transaccional.
    *   **Nuevo Paso 7:** Creación de documento dentro de la misma transacción si `data.documento` está presente.
    *   Genera radicado de documento, lo vincula con folio #1, y asigna a la carpeta auto-creada.
    *   Nuevo campo `forzar_creacion` permite crear incluso con duplicado detectado.
    *   Respuesta incluye `documento: { id, radicado, asunto, tipo_soporte }` cuando se crea documento.

#### Controlador de Expedientes
*   **Archivo:** `expediente.controller.js`
*   **Función `crearExpedienteCompleto`:** Ahora detecta automáticamente el formato de entrada.
    *   Si `req.body.data` existe → parsea como JSON string (multipart/form-data con archivo).
    *   Si no → usa `req.body` directo (JSON puro sin archivo).
    *   Pasa `req.file` al servicio para archivos adjuntos.

#### Rutas de Expedientes
*   **Archivo:** `expediente.routes.js`
*   **Ruta `POST /crear-completo`:** Incluye middleware `upload.single('archivo')` para aceptar archivos opcionales.
*   El endpoint acepta tanto JSON como multipart/form-data.

#### Controlador de Carpetas
*   **Archivo:** `carpeta.controller.js`
*   **`getCarpetas`:** Removido `LEFT JOIN cajas` (tabla no existente en la BD actual).
*   **`getCarpetaById`:** Removido `LEFT JOIN cajas` — ahora consulta solo la tabla `carpetas`.

#### Componente FileUpload
*   **Archivo:** `FileUpload.js`
*   **Mejora:** Nuevo prop `inputId` (default: `'file'`) para evitar conflictos de ID cuando hay múltiples instancias en la misma página.

#### Modal de Edición de Ubicación
*   **Archivo:** `EditLocationModal.js`
*   **Campo eliminado:** "Paquete / Caja" — ya no se muestra en el formulario de edición.

### Frontend

#### Componentes Modificados

| Componente | Cambios |
|---|---|
| `WizardCrearExpediente.js` | **Actualizado** — Sección "📄 Primer Documento" con checkbox para ambos tipos de soporte. Tipo de soporte del documento heredado del expediente. Envío como FormData cuando incluye archivo. |
| `DuplicadoAlertModal.js` | **Simplificado** — Muestra info + 3 botones (Cancelar, Anexar, Crear Nuevo) |
| `GestionExpedientes.js` | **Limpieza** — Eliminado modal viejo de creación (~350 líneas), eliminados estados y handlers obsoletos |
| `EditLocationModal.js` | **Simplificado** — Eliminado campo Paquete/Caja |
| `FileUpload.js` | **Mejorado** — Soporte para `inputId` dinámico |
| `AddExistingDocument.js` | **Corregido** — Verifica `tipo_soporte === 'Físico'` para permitir anexión a expedientes cerrados |
| `CreateNewDocument.js` | **Corregido** — Misma corrección de verificación de tipo de soporte |
| `GenerateFromTemplate.js` | **Corregido** — Misma corrección de verificación de tipo de soporte |

---

## 🔐 Auditoría

### Nuevas Acciones de Auditoría

| Acción | Descripción | Cuándo se registra |
|--------|-------------|---------------------|
| `CREACION_EXPEDIENTE_COMPLETO` | Registro de creación exitosa con tipo de soporte, display name, y documento vinculado (si aplica) | Al crear cualquier expediente |
| `MODIFICACION_FECHA_APERTURA` | Fecha del servidor vs fecha ingresada por el usuario | Solo cuando un expediente electrónico tiene fecha de apertura diferente al día actual |
| `ANEXO_EXPEDIENTE_CERRADO` | Detalle del documento anexado a expediente cerrado, con estado y soporte | Al agregar un documento a un expediente físico cerrado (Gestión o Central) |

---

## 🐛 Correcciones

| # | Error | Corrección |
|---|-------|------------|
| FIX-1 | `Unknown column 'id_usuario_creador'` al crear documento integrado | Corregido a `id_usuario_radicador` (nombre real de la columna en tabla `documentos`) |
| FIX-2 | `Table 'cajas' doesn't exist` al consultar carpetas | Eliminada referencia `LEFT JOIN cajas` en `getCarpetas` y `getCarpetaById` — la tabla `cajas` no existe en esta BD |
| FIX-3 | `codigo_carpeta` con constraint UNIQUE impedía carpetas con código duplicado | Eliminado constraint UNIQUE, reemplazado por INDEX normal |
| FIX-4 | Fallback `!!expediente.numero_paquete` clasificaba incorrectamente expedientes electrónicos como físicos | Removido fallback — ahora solo se verifica `tipo_soporte === 'Físico'` |

---

## 📋 Criterios de Aceptación (QA)

| # | Escenario | Resultado Esperado |
|---|-----------|-------------------|
| CA-1 | Crear expediente con campo personalizado duplicado | La validación del Paso 1 detiene el flujo y muestra `DuplicadoAlertModal` con 3 opciones |
| CA-2 | Crear expediente **Físico** sin duplicados, con documento | Paso 2 muestra fechas editables + ubicación física + sección "📄 Primer Documento físico" con asunto |
| CA-3 | Crear expediente **Electrónico** sin duplicados, con documento | Paso 2 muestra fecha auto-llenada + sección "💻 Primer Documento electrónico" con asunto y archivo obligatorio |
| CA-4 | Modificar la fecha automática de un expediente electrónico | Se muestra advertencia visual + registro `MODIFICACION_FECHA_APERTURA` en auditoría |
| CA-5 | Clic en "Crear Nuevo de todas formas" en modal de duplicado | El expediente se crea exitosamente con flag `forzar_creacion` |
| CA-6 | Clic en "Anexar al Existente" en modal de duplicado | Redirige a `/dashboard/expedientes/{id}` del expediente existente |
| CA-7 | Crear expediente Físico con documento incluido | Se crea el expediente + carpeta + paquete + documento con folio #1, todo en una sola acción |
| CA-8 | Crear expediente Electrónico con documento incluido | Se crea expediente + documento con archivo adjunto, vinculado con folio #1 |
| CA-9 | Editar ubicación física de un documento | Modal muestra Carpeta, Tomo, Estante, Entrepaño, Módulo, Ubicación Literal, Otro — **sin** Paquete/Caja |

---

## 🔄 Compatibilidad

*   **Requisito previo:** v1.4.3 debe estar aplicada.
*   **Migración de BD:** Debe ejecutarse `20260227_optimizar_flujo_expedientes.sql` antes del despliegue.
*   **Endpoint `crear-completo`:** Ahora acepta **ambos formatos**: JSON puro (sin documento) y multipart/form-data (con documento y archivo). Compatible hacia atrás con clientes existentes.
*   **Expedientes existentes:** No se ven afectados. Los nuevos campos tienen valores por defecto o permiten NULL. Los expedientes con `id_paquete` se marcan automáticamente como `tipo_soporte = 'Físico'`.

---
*Documevi SGDEA v1.5.3 - Gestión Documental Avanzada*
