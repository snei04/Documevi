const { Router } = require('express');
const { getAuditLog } = require('../controllers/auditoria.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Ruta para obtener el registro de auditoría
router.get('/', [authMiddleware, authorizePermission('auditoria_ver')], getAuditLog);

module.exports = router;