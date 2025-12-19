const { Router } = require('express');
const retencionController = require('../controllers/retencion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// GET /api/retencion/expedientes - Obtener expedientes vencidos o próximos a vencer
router.get('/expedientes', authorizePermission('retencion_ver'), retencionController.getExpedientesVencidos);

// GET /api/retencion/resumen - Obtener estadísticas de retención
router.get('/resumen', authorizePermission('retencion_ver'), retencionController.getResumenRetencion);

// GET /api/retencion/historial - Obtener historial de procesamientos
router.get('/historial', authorizePermission('retencion_ver'), retencionController.getHistorialRetencion);

// POST /api/retencion/procesar/:id - Procesar un expediente (conservar/eliminar)
router.post('/procesar/:id', authorizePermission('retencion_procesar'), retencionController.procesarExpediente);

// POST /api/retencion/transferir/:id - Transferir expediente a archivo central
router.post('/transferir/:id', authorizePermission('retencion_procesar'), retencionController.transferirACentral);

module.exports = router;
