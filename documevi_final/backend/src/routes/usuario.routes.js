
const { Router } = require('express');
const { getAllUsers, updateUser } = require('../controllers/usuario.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Todas estas rutas son solo para administradores (rol_id = 1)
router.use(authMiddleware, authorizeRoles(1));

router.get('/', getAllUsers);
router.put('/:id', updateUser);

module.exports = router;