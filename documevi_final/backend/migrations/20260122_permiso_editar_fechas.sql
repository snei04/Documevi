-- Migración para agregar permiso de edición de fechas de expediente
-- Fecha: 2026-01-22

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Crear el nuevo permiso
INSERT INTO permisos (nombre, descripcion) 
VALUES ('editar_fechas_expediente', 'Permite modificar las fechas de apertura y cierre de un expediente');

-- 2. Asignar el permiso al rol de Administrador (asumiendo id=1 para Admin, ajustar si es necesario)
-- Se usa una subconsulta para obtener el ID del permiso recién creado y el del rol
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'Administrador' 
AND p.nombre = 'editar_fechas_expediente';

-- 3. Asignar también al rol de Gestor Documental si existe
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'Gestor Documental' 
AND p.nombre = 'editar_fechas_expediente';

SET FOREIGN_KEY_CHECKS = 1;
