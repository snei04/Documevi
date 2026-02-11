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

// GET /api/retencion/dashboard - Dashboard completo de retención
router.get('/dashboard', authorizePermission('retencion_ver'), retencionController.getDashboardRetencion);

// GET /api/retencion/alertas - Obtener alertas de retención
router.get('/alertas', authorizePermission('retencion_ver'), retencionController.getAlertas);

// POST /api/retencion/alertas/:id/leer - Marcar alerta como leída
router.post('/alertas/:id/leer', authorizePermission('retencion_ver'), retencionController.marcarAlertaLeida);

// GET /api/retencion/historial - Obtener historial de procesamientos
router.get('/historial', authorizePermission('retencion_ver'), retencionController.getHistorialRetencion);

// POST /api/retencion/procesar/:id - Procesar un expediente (conservar/eliminar)
router.post('/procesar/:id', authorizePermission('retencion_procesar'), retencionController.procesarExpediente);

// POST /api/retencion/procesar-masivo - Procesamiento masivo
router.post('/procesar-masivo', authorizePermission('retencion_procesar'), retencionController.procesarMasivo);

// POST /api/retencion/transferir/:id - Transferir expediente a archivo central
router.post('/transferir/:id', authorizePermission('retencion_procesar'), retencionController.transferirACentral);

// POST /api/retencion/ejecutar-job - Ejecutar job de retención manualmente
router.post('/ejecutar-job', authorizePermission('retencion_procesar'), retencionController.ejecutarJob);

module.exports = router;
