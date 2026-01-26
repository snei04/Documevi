# 📋 Notas de Release - Documevi v1.2.2

**Fecha de lanzamiento:** 20 de enero de 2026

---

## 🚀 Nuevas Funcionalidades

### Visualización de Documentos en Expedientes

- **Búsqueda de documentos mejorada**: El selector de documentos en "Añadir Documento al Expediente" ahora incluye un campo de búsqueda en tiempo real que filtra por radicado o asunto.
- **Vista previa de documentos**: Botón "👁️ Ver" en los resultados de búsqueda que abre un modal emergente con los detalles del documento antes de seleccionarlo.
- **Modal de visor de documentos**: El botón "Ver Documento" ahora abre el archivo en una ventana emergente dentro de la aplicación en lugar de abrir una nueva pestaña del navegador.
  - Soporte para imágenes (JPG, PNG, GIF, etc.) con visualización directa
  - Soporte para PDFs con visor embebido
  - Botones de "Abrir en nueva pestaña" y "Descargar" disponibles en el modal

### Índice de Documentos Mejorado

- **Nuevas columnas**: Se agregaron las columnas "Tipo Soporte" y "Ubicación Física" al índice electrónico de documentos.
- **Badges de tipo de soporte**: Indicadores visuales con colores diferenciados:
  - 🟢 Verde: Electrónico
  - 🟠 Naranja: Físico
  - 🔵 Azul: Híbrido
- **Enlace a detalle**: El radicado del documento ahora es un enlace clickeable que lleva a la vista de detalle completo del documento.

### Vista de Detalle de Documento

- Nuevo componente `DocumentoDetalle` que muestra toda la información del documento incluyendo:
  - Información básica (radicado, asunto, fecha)
  - Tipo de soporte con badge visual
  - Ubicación física para documentos físicos/híbridos
  - Información del remitente
  - Archivo digital con visor emergente
  - Firma digital (si aplica)

---

## 🔧 Mejoras Técnicas

### Permisos y Acceso

- **Acceso a expedientes**: Todos los usuarios autenticados ahora pueden ver la lista de expedientes y acceder a su detalle.
- **Vista restringida funcional**: Los usuarios sin permisos especiales ven correctamente la vista restringida con opción de solicitar préstamo.
- **Manejo de errores robusto**: Se implementó `Promise.allSettled` para cargar datos adicionales sin que falle toda la página si alguna petición no tiene permisos.

### Backend

- Rutas `/expedientes` y `/expedientes/:id` ya no requieren el permiso `expedientes_ver` - la lógica de permisos se maneja en el controlador.
- Nuevo endpoint `GET /documentos/:id` para obtener detalle completo de un documento.

### Frontend

- Componente `AccionesProductor.js` refactorizado con búsqueda y modal de vista previa.
- Componente `IndiceDocumentos.js` actualizado con nuevas columnas y enlaces.
- API `expedienteAPI.js` mejorada con manejo de errores graceful.

---

## 🐛 Correcciones de Errores

- **Error "al cargar datos iniciales"**: Corregido el error que impedía a usuarios sin permisos ver expedientes y solicitar préstamos.
- **Visor de documentos**: Corregido el problema donde las imágenes no se mostraban en el iframe (ahora usa `<img>` para imágenes).
- **Puerto del backend**: Corregida la URL del API de puerto 5000 a 4000 en el visor de documentos.
- **Campo ubicacion_fisica**: Corregido el nombre del campo en scripts de migración (era `cacion_fisica`).

---

## �️ Ajustes en Base de Datos

- **Script de carga de expedientes**: Actualizado `migrations/ejemplo_carga_expedientes.sql` para usar la columna correcta `ubicacion_fisica` en `documentos`.
- **Datos de ejemplo**: Normalización de formatos de fecha y limpieza de duplicados en los inserts de documentos.

---

## �📁 Archivos Modificados

### Backend

- `src/routes/expediente.routes.js` - Permisos de rutas
- `src/routes/documento.routes.js` - Nueva ruta de detalle
- `src/controllers/documento.controller.js` - Función `getDocumentoById`

### Frontend

- `src/components/DocumentoDetalle.js` - Nuevo componente
- `src/components/ExpedienteDetalle.js` - Integración de vista restringida
- `src/components/expediente/AccionesProductor.js` - Búsqueda y modal
- `src/components/expediente/IndiceDocumentos.js` - Nuevas columnas y enlaces
- `src/components/expediente/VistaRestringida.js` - Sin cambios (verificado)
- `src/api/expedienteAPI.js` - Manejo de errores mejorado
- `src/App.js` - Nueva ruta `/dashboard/documentos/:id`

### Migraciones

- `migrations/ejemplo_carga_expedientes.sql` - Corrección de campo `ubicacion_fisica`

---

## 📌 Notas de Actualización

1. **Reiniciar backend** después de actualizar para aplicar cambios en rutas.
2. **Limpiar caché del navegador** si hay problemas con el frontend.
3. **Ejecutar el script de migración actualizado** si usas datos de ejemplo o cargas masivas.
4. Los usuarios existentes no necesitan cambios en sus permisos.

---

## 🔜 Próximas Versiones

- Mejoras en el sistema de workflows
- Notificaciones en tiempo real
- Exportación de reportes en múltiples formatos

---

**Equipo de Desarrollo Documevi**
