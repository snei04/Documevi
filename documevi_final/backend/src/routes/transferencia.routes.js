// Archivo: backend/src/routes/transferencia.routes.js
const { Router } = require('express');
const { realizarTransferencia } = require('../controllers/transferencia.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Esta acción es solo para administradores
router.post('/', [authMiddleware, authorizeRoles(1)], realizarTransferencia);

module.exports = router;