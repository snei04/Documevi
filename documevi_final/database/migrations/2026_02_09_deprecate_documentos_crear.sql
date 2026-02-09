-- =====================================================
-- Migración: Deprecar permiso documentos_crear
-- Versión: 1.3.3
-- Fecha: 2026-02-09
-- Descripción: El permiso documentos_crear fue reemplazado por expedientes_crear
--              ya que los documentos ahora se crean solo dentro del contexto de expedientes.
-- =====================================================

-- Opción 1: Marcar como deprecado (recomendado para mantener compatibilidad)
UPDATE permisos 
SET descripcion = '[DEPRECADO v1.3.3] Usar expedientes_crear. Permite capturar y subir nuevos documentos'
WHERE nombre_permiso = 'documentos_crear';

-- Opción 2: Eliminar el permiso (descomentarear si se desea eliminar definitivamente)
-- DELETE FROM rol_permisos WHERE id_permiso = (SELECT id FROM permisos WHERE nombre = 'documentos_crear');
-- DELETE FROM permisos WHERE nombre = 'documentos_crear';

-- =====================================================
-- RESUMEN DE PERMISOS PARA DOCUMENTACIÓN
-- =====================================================
-- 
-- PERMISOS DE GESTIÓN DOCUMENTAL (DOCUMENTOS Y EXPEDIENTES):
-- 
-- | ID  | Nombre                          | Descripción                                  | Estado      |
-- |-----|----------------------------------|----------------------------------------------|-------------|
-- | 101 | documentos_ver                   | Permite ver la lista de documentos           | ✅ ACTIVO   |
-- | 102 | documentos_crear                 | Capturar y subir nuevos documentos           | ⚠️ DEPRECADO|
-- | 103 | expedientes_ver                  | Permite ver la lista de expedientes          | ✅ ACTIVO   |
-- | 104 | expedientes_crear                | Crear expedientes Y documentos nuevos        | ✅ ACTIVO   |
-- | 105 | expedientes_editar               | Editar información de un expediente          | ✅ ACTIVO   |
-- | 106 | expedientes_cerrar               | Cerrar un expediente                         | ✅ ACTIVO   |
-- | 347 | expedientes_agregar_documentos   | Agregar/vincular documentos existentes       | ✅ ACTIVO   |
-- | 348 | expedientes_custom_data          | Editar datos personalizados de expedientes   | ✅ ACTIVO   |
-- | 353 | documentos_editar                | Editar documentos existentes                 | ✅ ACTIVO   |
-- | 354 | documentos_firmar                | Firmar documentos                            | ✅ ACTIVO   |
-- | 355 | documentos_workflow              | Iniciar y avanzar workflows en documentos    | ✅ ACTIVO   |
-- 
-- CAMBIO PRINCIPAL v1.3.3:
-- - documentos_crear → Reemplazado por expedientes_crear
-- - Los documentos ahora SOLO se crean dentro del contexto de un expediente
-- - El wizard unificado usa expedientes_crear para crear expediente + documento
-- - La opción "Crear Documento Nuevo" en detalle de expediente usa expedientes_crear
-- =====================================================
</CodeContent>
<parameter name="EmptyFile">false
