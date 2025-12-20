# Release Notes - DOCUMEVI SGDEA v1.1.1

**Fecha de lanzamiento:** 20 de diciembre de 2025

---

## 🎯 Resumen

Esta versión incluye mejoras significativas en la interfaz de usuario, nuevas funcionalidades de búsqueda avanzada con campos personalizados, un nuevo módulo de Retención Documental, **documentación completa del código fuente**, **mejoras en la colección de API de Postman**, **gestión de permisos mejorada** y **footer informativo en el dashboard**.

---

## ✨ Nuevas Funcionalidades

### Módulo de Retención Documental

- **Nueva vista de retención**: Panel para visualizar expedientes con retención vencida o próxima a vencer según la Tabla de Retención Documental (TRD).
- **Estadísticas en tiempo real**: Tarjetas con conteo de expedientes vencidos, próximos a vencer y procesados.
- **Procesamiento de expedientes**: Funcionalidad para marcar expedientes como eliminados o conservados.
- **Transferencia a Archivo Central**: Opción para transferir expedientes de Gestión a Central.
- **Historial de acciones**: Registro de todas las acciones de retención realizadas.
- **Permisos específicos**: `retencion_ver` y `retencion_procesar` para control de acceso.

### Búsqueda Avanzada con Campos Personalizados

- **Búsqueda en metadatos**: La búsqueda básica ahora incluye los campos personalizados (metadatos) de documentos y expedientes.
- **Panel de búsqueda avanzada**: Nuevo panel desplegable con filtros múltiples:
  - Término de búsqueda general
  - Rango de fechas
  - Oficina productora
  - Serie y subserie documental
  - Tipo de soporte (Electrónico, Físico, Híbrido)
  - Campo personalizado específico con valor
- **Resultados en tabla**: Vista tabular con información detallada de los documentos encontrados.

### Colección Postman Mejorada

- **Documentación completa**: Cada endpoint incluye descripción detallada, campos requeridos y ejemplos.
- **Script automático de Login**: El token se guarda automáticamente en las variables de colección.
- **Organización por subcarpetas**: Usuarios dividido en "Perfil" y "Administración".
- **Ejemplos de body**: Todos los endpoints POST/PUT incluyen ejemplos de payload.
- **Variables de URL documentadas**: Parámetros como `:id` y `:token` con descripciones.
- **Endpoint Logout agregado**: Faltaba en la colección anterior.

---

## 🎨 Mejoras de Interfaz de Usuario

### Formulario de Captura de Documentos

- **Clasificación TRD mejorada**: Selectores muestran código + nombre (ej: `001 - Dependencia Ejemplo`).
- **Selectores en cascada**: Los selectores se deshabilitan hasta seleccionar el anterior, con mensajes informativos.
- **Ubicación física estructurada**: Nuevos campos para documentos físicos:
  - **Obligatorios**: Carpeta, Paquete
  - **Opcionales**: Tomo, Otro, Módulo, Estante, Entrepaño, Ubicación
- **Diseño en grid**: Formularios organizados en grids de 2, 3 y 4 columnas según la sección.
- **Labels descriptivos**: Todos los campos con etiquetas claras y placeholders de ejemplo.

### Gestión de Expedientes

- **Modal de creación**: El formulario de creación ahora se muestra en un modal.
- **Panel de estadísticas**: Tarjetas con conteo por estado (Total, En Trámite, Cerrados en Gestión, Cerrados en Central).
- **Filtros avanzados**: Búsqueda por nombre, filtro por estado y por serie.
- **Tabla mejorada**: Columnas adicionales (Fecha Apertura, Disponibilidad), badges de estado con colores.
- **Manejo de subseries**: Detecta automáticamente si la serie requiere subserie.

### Gestión de Usuarios (Rediseño Completo)

- **Nuevo encabezado visual**: Header con gradiente azul, icono y subtítulo descriptivo.
- **Tarjetas de estadísticas**: Contadores de Total, Activos e Inactivos en tiempo real.
- **Formulario de invitación mejorado**:
  - Diseño de tarjeta con animación de entrada
  - Labels visibles y placeholders descriptivos
  - Grid responsive de 4 columnas
- **Tabla de usuarios rediseñada**:
  - Avatares con inicial del nombre
  - Columna combinada nombre + email
  - Badges para documento y rol
  - Estados visuales con dot indicator
  - Filas inactivas con fondo diferenciado
- **Estados de carga y vacío**: Spinner animado y mensaje cuando no hay datos.
- **Estilos CSS dedicados**: Nuevo archivo `GestionUsuarios.css` con diseño moderno y responsive.

### Gestión de Permisos Mejorada

- **Filtrado por permisos del usuario**: El árbol de permisos ahora solo muestra los permisos que el usuario actual tiene asignados.
- **Restricción de asignación**: Un usuario solo puede asignar a otros roles los permisos que él mismo posee.
- **Contador de módulos**: Cada grupo muestra la cantidad de módulos visibles.
- **Mensaje informativo**: Indica cuántos permisos tiene disponibles el usuario para asignar.
- **Estado vacío**: Muestra mensaje cuando el usuario no tiene permisos para asignar.
- **Corrección de permiso**: `GestionarPermisosMaestro.js` ahora usa `permisos_editar` en lugar de `gestionar_roles_permisos`.

### Footer del Dashboard

- **Nuevo footer informativo**: Aparece en todas las páginas del dashboard.
- **Información de copyright**: "Todos los derechos reservados 2025 | Desarrollado por IMEVISAS desde el equipo de TI".
- **Versión del sistema**: Muestra la versión actual (v1.1.1) destacada en color primario.
- **Diseño oscuro**: Fondo `#1a1a2e` con texto gris y versión en azul.

### Selectores TRD en toda la aplicación

- **Oficinas**: Muestra `código_oficina - nombre_oficina`
- **Series**: Muestra `código_serie - nombre_serie`
- **Subseries**: Muestra `código_subserie - nombre_subserie`
- **Dependencias**: Muestra `código_dependencia - nombre_dependencia`

Componentes actualizados:

- `GestionOficinas.js`
- `GestionSeries.js`
- `GestionSubseries.js`
- `GestionExpedientes.js`
- `CapturaDocumento.js`
- `Search.js`

---

## 🔧 Mejoras Técnicas

### Backend

- **Controlador de retención** (`retencion.controller.js`): Lógica para gestionar expedientes vencidos.
- **Rutas de retención** (`retencion.routes.js`): Endpoints para el módulo de retención.
- **Búsqueda mejorada** (`search.controller.js`):
  - `search()`: Incluye búsqueda en `documento_datos_personalizados` y `expediente_datos_personalizados`.
  - `advancedSearch()`: Nueva función con filtros múltiples.
  - `getSearchableCustomFields()`: Obtiene campos personalizados disponibles.
- **Rutas de búsqueda** (`search.routes.js`):
  - `GET /search` - Búsqueda básica
  - `GET /search/avanzada` - Búsqueda avanzada
  - `GET /search/campos-personalizados` - Lista campos personalizados

### Documentación del Código (JSDoc)

Se agregaron comentarios JSDoc completos y comentarios inline a los siguientes archivos:

**Controladores Backend:**

- `auth.controller.js` - Autenticación, login, registro, recuperación de contraseña
- `usuario.controller.js` - Gestión de usuarios, perfiles, invitaciones
- `workflow.controller.js` - Workflows, pasos y tareas
- `transferencia.controller.js` - Transferencias documentales

**Rutas Backend:**

- `dependencia.routes.js` - Rutas de dependencias con documentación de endpoints

**Hooks Frontend:**

- `useAuth.js` - Hook de autenticación
- `usePermissions.js` - Hook de verificación de permisos
- `usePermissionTree.js` - Hook de árbol de permisos
- `useExpedienteData.js` - Hook de datos de expediente
- `useGrapesJSEditor.js` - Hook del editor de plantillas
- `useInactivityTimeout.js` - Hook de timeout por inactividad

**API Frontend:**

- `expedienteAPI.js` - Funciones de API de expedientes

**Contextos Frontend:**

- `PermissionsContext.js` - Contexto de permisos

**Formato de documentación:**

- `@fileoverview` con descripción del módulo
- `@param` y `@returns` para funciones
- `@async` para funciones asíncronas
- `@example` con ejemplos de uso
- Secciones organizadas con separadores visuales
- Comentarios inline explicando lógica compleja

### Frontend

- **Nuevos componentes**:
  - `RetencionDocumental.js` - Módulo de retención documental
  - `GestionUsuarios.js` - Rediseño completo con nuevo diseño visual
- **Componentes mejorados**:
  - `GestionPermisos.js` - Filtrado de permisos según usuario actual
  - `GestionarPermisosMaestro.js` - Corrección de permisos
  - `DashboardLayout.js` - Nuevo footer informativo
- **Nuevos estilos CSS**:
  - `GestionUsuarios.css` - Estilos dedicados para gestión de usuarios
  - `.dashboard-footer` - Estilos para el footer del dashboard
  - `.permission-tree__count` - Contador de módulos en árbol de permisos
- **Estilos CSS** (`Dashboard.css`):
  - `.form-grid-2`, `.form-grid-3`, `.form-grid-4` - Grids responsivos
  - `.form-group` - Estilos mejorados para formularios
  - `.filters-row`, `.filter-group` - Estilos para filtros
  - `.stat-card`, `.stats-grid` - Tarjetas de estadísticas
  - `.status-badge`, `.serie-badge` - Badges de estado

### Base de Datos

- **Nueva tabla**: `retencion_notificaciones` para historial de acciones de retención.
- **Nuevos permisos**: `retencion_ver`, `retencion_procesar`, `busqueda_avanzada`.

---

## 📁 Archivos Modificados

### Backend

**Controladores:**

- `src/controllers/retencion.controller.js` (nuevo)
- `src/controllers/search.controller.js`
- `src/controllers/auth.controller.js` (documentación)
- `src/controllers/usuario.controller.js` (documentación)
- `src/controllers/workflow.controller.js` (documentación)
- `src/controllers/transferencia.controller.js` (documentación)

**Rutas:**

- `src/routes/retencion.routes.js` (nuevo)
- `src/routes/search.routes.js`
- `src/routes/dependencia.routes.js` (documentación)

**Otros:**

- `server.js`
- `Documevi_API_Postman_Collection.json` (mejoras completas)

### Frontend

**Componentes:**

- `src/components/RetencionDocumental.js` (nuevo)
- `src/components/GestionUsuarios.js` (rediseño completo)
- `src/components/GestionExpedientes.js`
- `src/components/GestionOficinas.js`
- `src/components/GestionSeries.js`
- `src/components/GestionSubseries.js`
- `src/components/CapturaDocumento.js`
- `src/components/Search.js`
- `src/components/Sidebar.js`

**Estilos:**

- `src/components/Dashboard.css`
- `src/components/GestionUsuarios.css` (nuevo)

**Hooks (documentación):**

- `src/hooks/useAuth.js`
- `src/hooks/usePermissions.js`
- `src/hooks/usePermissionTree.js`
- `src/hooks/useExpedienteData.js`
- `src/hooks/useGrapesJSEditor.js`
- `src/hooks/useInactivityTimeout.js`

**API (documentación):**

- `src/api/expedienteAPI.js`

**Contextos (documentación):**

- `src/context/PermissionsContext.js`

**Otros:**

- `src/App.js` (documentación JSDoc completa)
- `src/components/DashboardLayout.js` (footer)
- `src/components/GestionPermisos.js` (filtrado de permisos)
- `src/components/GestionarPermisosMaestro.js` (corrección de permisos)
- `src/components/PermissionTree.css` (estilos de contador)

---

## 🐛 Correcciones

- Eliminado import no utilizado `useOutletContext` en `Search.js`.
- Removidos emojis del título de "Retención Documental" en el sidebar y header.
- Corregido permiso en `GestionarPermisosMaestro.js`: cambiado de `gestionar_roles_permisos` a `permisos_editar` para coincidir con el backend.
- Eliminado import no utilizado `usePermissions` en `GestionPermisos.js`.

---

## 📋 Requisitos de Migración

### Base de Datos

Ejecutar los siguientes comandos SQL:

```sql
-- Crear tabla de notificaciones de retención
CREATE TABLE IF NOT EXISTS retencion_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_expediente INT NOT NULL,
    tipo_notificacion ENUM('vencido_gestion', 'vencido_central', 'proximo_vencer') NOT NULL,
    accion_tomada ENUM('pendiente', 'eliminado', 'conservado', 'transferido') DEFAULT 'pendiente',
    fecha_notificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_accion DATETIME NULL,
    id_usuario_accion INT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_expediente) REFERENCES expedientes(id),
    FOREIGN KEY (id_usuario_accion) REFERENCES usuarios(id)
);

-- Agregar permisos
INSERT INTO permisos (nombre_permiso, descripcion, grupo) VALUES
('retencion_ver', 'Ver módulo de retención documental', 'Retención'),
('retencion_procesar', 'Procesar expedientes en retención', 'Retención'),
('busqueda_avanzada', 'Acceso a búsqueda avanzada', 'Búsqueda');

-- Asignar permisos al rol administrador (ajustar ID según corresponda)
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 1, id FROM permisos WHERE nombre_permiso IN ('retencion_ver', 'retencion_procesar', 'busqueda_avanzada');
```

---

## 🔄 Compatibilidad

- **Node.js**: >= 14.x
- **React**: 18.x
- **MySQL**: >= 5.7

---

## 👥 Equipo de Desarrollo

- **IMEVI SAS** - Desarrollo y mantenimiento

---

_Para reportar problemas o sugerencias, contactar al equipo de soporte técnico._
