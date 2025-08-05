const { Router } = require('express');
const { getAllRoles, createRole, updateRole, deleteRole } = require('../controllers/rol.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Todas las rutas de roles son solo para administradores
router.use(authMiddleware, authorizeRoles(1));

router.route('/')
  .get(getAllRoles)
  .post(createRole);

router.route('/:id')
  .put(updateRole)
  .delete(deleteRole);

module.exports = router;