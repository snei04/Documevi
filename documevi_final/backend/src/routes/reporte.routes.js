const { Router } = require('express');
const { generateFUID, getTrazabilidadExpediente } = require('../controllers/reporte.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Generar reporte FUID
router.get('/fuid', authorizePermission('reportes_fuid'), generateFUID);

// Obtener trazabilidad de expediente
router.get('/fuid/trazabilidad/:id', authorizePermission('reportes_fuid'), getTrazabilidadExpediente);

module.exports = router;