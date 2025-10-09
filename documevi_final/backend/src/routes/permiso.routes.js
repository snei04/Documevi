const { Router } = require('express');
const permisoController = require('../controllers/permiso.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);
// Ruta para obtener el árbol de permisos
router.get('/tree', permisoController.getPermissionsTree);

// Rutas para la gestión de permisos individuales
router.get('/', authorizePermission('permisos_ver'), permisoController.getAllPermissions);
router.post('/', authorizePermission('permisos_crear'), permisoController.createPermiso);
router.put('/:id', authorizePermission('permisos_editar'), permisoController.updatePermiso);

// Rutas para la asignación de permisos a roles
router.get('/rol/:id_rol', authorizePermission('permisos_ver'), permisoController.getRolePermissions);
router.put('/rol/:id_rol', authorizePermission('permisos_asignar'), permisoController.updateRolePermissions);

module.exports = router;
