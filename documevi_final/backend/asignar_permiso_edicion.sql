-- Script para asignar el permiso 'expedientes_editar' a un rol específico
-- Reemplaza EL_ID_DEL_ROL con el ID del rol al que deseas dar permiso (ej: 2 para Productor, 1 para Admin)

SET @RolID = 2; -- Cambia esto por el ID de tu rol (Consulta la tabla 'roles' para saber cuál es)

-- Insertar el permiso si no existe ya para ese rol
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT @RolID, p.id
FROM permisos p
WHERE p.nombre_permiso = 'expedientes_editar'
AND NOT EXISTS (
    SELECT 1 FROM rol_permisos rp 
    WHERE rp.id_rol = @RolID AND rp.id_permiso = p.id
);

SELECT CONCAT('Permiso expedientes_editar asignado al rol ', @RolID) as Mensaje;
