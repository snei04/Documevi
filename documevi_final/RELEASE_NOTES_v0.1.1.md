# Release Notes - DOCUMEVI SGDEA v1.1.1

**Fecha de lanzamiento:** 10 de diciembre de 2025

---

## 🎯 Resumen

Esta versión incluye mejoras significativas en la interfaz de usuario, nuevas funcionalidades de búsqueda avanzada con campos personalizados, y un nuevo módulo de Retención Documental para gestionar el ciclo de vida de los expedientes según la TRD.

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

### Frontend

- **Nuevos componentes**:
  - `RetencionDocumental.js` - Módulo de retención documental
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

- `src/controllers/retencion.controller.js` (nuevo)
- `src/controllers/search.controller.js`
- `src/routes/retencion.routes.js` (nuevo)
- `src/routes/search.routes.js`
- `server.js`

### Frontend

- `src/components/RetencionDocumental.js` (nuevo)
- `src/components/GestionExpedientes.js`
- `src/components/GestionOficinas.js`
- `src/components/GestionSeries.js`
- `src/components/GestionSubseries.js`
- `src/components/CapturaDocumento.js`
- `src/components/Search.js`
- `src/components/Sidebar.js`
- `src/components/Dashboard.css`
- `src/App.js`

---

## 🐛 Correcciones

- Eliminado import no utilizado `useOutletContext` en `Search.js`.
- Removidos emojis del título de "Retención Documental" en el sidebar y header.

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
