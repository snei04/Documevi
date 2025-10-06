// En src/routes/permiso.routes.js
const { Router } = require('express');
const permisoController = require('../controllers/permiso.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);
// Ruta para obtener el árbol de permisos
router.get('/tree', permisoController.getPermissionsTree);

// Rutas para la gestión de permisos individuales
router.get('/', permisoController.getAllPermissions);
router.post('/', authorizePermission('gestionar_roles_permisos'), permisoController.createPermiso);
router.put('/:id', authorizePermission('gestionar_roles_permisos'), permisoController.updatePermiso);

// Rutas para la asignación de permisos a roles
router.get('/rol/:id_rol', permisoController.getRolePermissions);
router.put('/rol/:id_rol', authorizePermission('gestionar_roles_permisos'), permisoController.updateRolePermissions);

module.exports = router;