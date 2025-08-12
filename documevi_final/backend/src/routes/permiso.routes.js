// Archivo: backend/src/routes/permiso.routes.js
const { Router } = require('express');
const { getAllPermissions, getRolePermissions, updateRolePermissions } = require('../controllers/permiso.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Todas estas rutas son solo para administradores
router.use(authMiddleware, authorizeRoles(1));

// Obtener la lista de todos los permisos disponibles
router.get('/', getAllPermissions);

// Obtener y actualizar los permisos de un rol específico
router.route('/rol/:id_rol')
  .get(getRolePermissions)
  .put(updateRolePermissions);

module.exports = router;