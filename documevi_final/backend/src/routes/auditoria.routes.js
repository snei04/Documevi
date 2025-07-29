// Archivo: backend/src/routes/auditoria.routes.js
const { Router } = require('express');
const { getAuditLog } = require('../controllers/auditoria.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Esta ruta es solo para administradores (rol_id = 1)
router.get('/', [authMiddleware, authorizeRoles(1)], getAuditLog);

module.exports = router;