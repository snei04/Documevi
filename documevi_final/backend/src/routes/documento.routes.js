const { Router } = require('express');
const { 
    createDocumento,
    getAllDocumentos,
    getDocumentoById,
    startWorkflow,   
    advanceWorkflow,
    firmarDocumento,
    createDocumentoFromPlantillaSinExpediente 
} = require('../controllers/documento.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');
const upload = require('../config/upload');

const router = Router();
router.use(authMiddleware);

// Rutas existentes para crear y listar documentos
router.route('/')
  .get(authorizePermission('documentos_ver'), getAllDocumentos)
  .post(authorizePermission('documentos_crear'), upload.single('archivo'), createDocumento);

// Ruta para generar desde plantilla
router.post('/desde-plantilla', authorizePermission('documentos_crear'), createDocumentoFromPlantillaSinExpediente);

// Ruta para obtener detalle de un documento
router.get('/:id', authorizePermission('documentos_ver'), getDocumentoById);

// --- Rutas nuevas para la ejecución del workflow ---
router.post('/:id/start-workflow', authorizePermission('documentos_workflow'), startWorkflow);
router.post('/:id/advance-workflow', authorizePermission('documentos_workflow'), advanceWorkflow);
router.post('/:id/firmar', authorizePermission('documentos_firmar'), firmarDocumento);

module.exports = router;