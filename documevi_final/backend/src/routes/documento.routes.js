const { Router } = require('express');
const {
  createDocumento,
  getAllDocumentos,
  getDocumentoById,
  startWorkflow,
  advanceWorkflow,
  firmarDocumento,
  createDocumentoFromPlantillaSinExpediente,
  createDocumentoConExpediente
} = require('../controllers/documento.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');
const upload = require('../config/upload');

const router = Router();
router.use(authMiddleware);

// Rutas existentes para crear y listar documentos
// NOTA: documentos_crear fue deprecado en v1.3.3, ahora usa expedientes_crear
router.route('/')
  .get(authorizePermission('documentos_ver'), getAllDocumentos)
  .post(authorizePermission('expedientes_crear'), upload.single('archivo'), createDocumento);

// Ruta para generar desde plantilla (legacy - usa expedientes_crear)
router.post('/desde-plantilla', authorizePermission('expedientes_crear'), createDocumentoFromPlantillaSinExpediente);

// Ruta para crear documento y vincularlo a expediente existente
router.post('/con-expediente', authorizePermission('expedientes_crear'), upload.single('archivo'), createDocumentoConExpediente);

// Ruta para obtener detalle de un documento
router.get('/:id', authorizePermission('documentos_ver'), getDocumentoById);

// --- Rutas nuevas para la ejecución del workflow ---
router.post('/:id/start-workflow', authorizePermission('documentos_workflow'), startWorkflow);
router.post('/:id/advance-workflow', authorizePermission('documentos_workflow'), advanceWorkflow);
router.post('/:id/firmar', authorizePermission('documentos_firmar'), firmarDocumento);

// Ruta para actualizar ubicación física del documento
router.put('/:id/ubicacion', authorizePermission('documentos_editar'), require('../controllers/documento.controller').updateDocumentoLocation);

module.exports = router;