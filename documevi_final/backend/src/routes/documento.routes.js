const { Router } = require('express');
const { 
    createDocumento,
    getAllDocumentos,
    startWorkflow,   
    advanceWorkflow,
    firmarDocumento,
    // ✅ 1. Importa la nueva función del controlador
    createDocumentoFromPlantillaSinExpediente 
} = require('../controllers/documento.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../config/upload');

const router = Router();
router.use(authMiddleware);

// Rutas existentes para crear y listar documentos
router.route('/')
  .get(getAllDocumentos)
  .post(upload.single('archivo'), createDocumento);

// ✅ 2. Añade la nueva ruta para generar desde plantilla
router.post('/desde-plantilla', createDocumentoFromPlantillaSinExpediente);

// --- Rutas nuevas para la ejecución del workflow ---
router.post('/:id/start-workflow', startWorkflow);
router.post('/:id/advance-workflow', advanceWorkflow);
router.post('/:id/firmar', firmarDocumento);

module.exports = router;