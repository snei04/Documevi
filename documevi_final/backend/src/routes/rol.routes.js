const { Router } = require('express');
const { getAllRoles, createRole, updateRole, deleteRole } = require('../controllers/rol.controller');
const authMiddleware = require('../middleware/auth.middleware');

// 1. Importamos el middleware de permisos que hemos estado usando
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// 2. Aplicamos la autenticación (saber quién es el usuario) a todas las rutas del archivo
router.use(authMiddleware);

// 3. Aplicamos la autorización (saber qué puede hacer) a cada ruta específica
//    Usamos el permiso que ya existe en tu base de datos.
router.route('/')
  .get(authorizePermission('gestionar_roles_permisos'), getAllRoles)
  .post(authorizePermission('gestionar_roles_permisos'), createRole);

router.route('/:id')
  .put(authorizePermission('gestionar_roles_permisos'), updateRole)
  .delete(authorizePermission('gestionar_roles_permisos'), deleteRole);

module.exports = router;