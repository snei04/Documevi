// Archivo: backend/src/routes/dependencia.routes.js
const { Router } = require('express');
const { getAllDependencias, createDependencia } = require('../controllers/dependencia.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// GET /api/dependencias - Permitido para Administradores (1) y Operadores (2)
router.get('/', [authMiddleware, authorizeRoles(1, 2)], getAllDependencias);

// POST /api/dependencias - Permitido solo para Administradores (1)
router.post('/', [authMiddleware, authorizeRoles(1)], createDependencia);

// Aquí añadiríamos las rutas de Actualizar (PUT) y Eliminar (DELETE), también solo para administradores.
// router.put('/:id', [authMiddleware, authorizeRoles(1)], updateDependencia);
// router.delete('/:id', [authMiddleware, authorizeRoles(1)], deleteDependencia);

module.exports = router;
