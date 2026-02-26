-- ==========================================================
-- Script de Migración a Producción v1.4.3 - Documevi SGDEA
-- Fecha: 2026-02-25
-- Descripción: Script consolidado con todos los cambios de
--              base de datos para el release v1.4.3
-- ==========================================================
-- 
-- REQUISITOS PREVIOS:
--   - v1.3.3 debe estar aplicado previamente.
--   - Realizar backup de la base de datos antes de ejecutar.
--
-- CAMBIOS INCLUIDOS:
--   1. Nuevos permisos para edición/eliminación de Campos Personalizados
--   2. Nuevos permisos para edición/eliminación de Workflows
--   3. Nuevos permisos para edición/eliminación de Plantillas
--   4. Nuevos permisos para gestión de Roles (crear/editar/eliminar)
--   5. Asignación automática de permisos al rol Administrador
--   6. No hay cambios de esquema (tablas/columnas ya existen de v1.3.3)
--
-- ==========================================================

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ==========================================================
-- 1. Permisos de Campos Personalizados
-- ==========================================================

-- Crear permisos si no existen
INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('campos_editar', 'Permite editar campos personalizados de oficinas.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('campos_eliminar', 'Permite eliminar campos personalizados de oficinas. ⚠️ Elimina datos asociados.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('campos_crear', 'Permite crear nuevos campos personalizados en oficinas.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('campos_ver', 'Permite visualizar campos personalizados de oficinas.');


-- ==========================================================
-- 2. Permisos de Workflows
-- ==========================================================

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('workflows_crear', 'Permite crear nuevos workflows y pasos.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('workflows_editar', 'Permite editar workflows existentes y sus pasos.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('workflows_eliminar', 'Permite eliminar workflows y sus pasos. ⚠️ Valida documentos asociados.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('workflows_ver', 'Permite visualizar workflows y sus pasos.');


-- ==========================================================
-- 3. Permisos de Plantillas
-- ==========================================================

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('plantillas_crear', 'Permite crear nuevas plantillas de documentos.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('plantillas_editar', 'Permite editar plantillas existentes y sus campos.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('plantillas_eliminar', 'Permite eliminar plantillas y sus campos. ⚠️ Elimina diseños asociados.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('plantillas_ver', 'Permite visualizar plantillas de documentos.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('plantillas_disenar', 'Permite acceder al diseñador visual de plantillas.');


-- ==========================================================
-- 4. Permisos de Gestión de Roles
-- ==========================================================

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('roles_crear', 'Permite crear nuevos roles en el sistema.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('roles_editar', 'Permite editar roles existentes.');

INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('roles_eliminar', 'Permite eliminar roles. ⚠️ Afecta usuarios asignados al rol.');


-- ==========================================================
-- 5. Asignar todos los nuevos permisos al rol Administrador
-- ==========================================================
-- Se asume que el rol Administrador tiene id = 1.
-- INSERT IGNORE evita duplicados si ya están asignados.

INSERT IGNORE INTO rol_permisos (id_rol, id_permiso)
SELECT 1, id FROM permisos WHERE nombre_permiso IN (
    'campos_crear',
    'campos_ver',
    'campos_editar',
    'campos_eliminar',
    'workflows_crear',
    'workflows_ver',
    'workflows_editar',
    'workflows_eliminar',
    'plantillas_crear',
    'plantillas_ver',
    'plantillas_editar',
    'plantillas_eliminar',
    'plantillas_disenar',
    'roles_crear',
    'roles_editar',
    'roles_eliminar'
);


-- ==========================================================
-- 6. Verificación (Consulta de validación, no ejecuta cambios)
-- ==========================================================
-- Ejecutar manualmente para confirmar:
-- 
-- SELECT p.id, p.nombre_permiso, p.descripcion,
--        CASE WHEN rp.id_rol IS NOT NULL THEN '✅ Asignado' ELSE '❌ No asignado' END AS estado_admin
-- FROM permisos p
-- LEFT JOIN rol_permisos rp ON p.id = rp.id_permiso AND rp.id_rol = 1
-- WHERE p.nombre_permiso LIKE 'campos_%'
--    OR p.nombre_permiso LIKE 'workflows_%'
--    OR p.nombre_permiso LIKE 'plantillas_%'
--    OR p.nombre_permiso LIKE 'roles_%'
-- ORDER BY p.nombre_permiso;
--


SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- Fin del Script v1.4.3
-- ==========================================================
