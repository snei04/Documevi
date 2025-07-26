const { Router } = require('express');
const { 
    createDocumento,
    getAllDocumentos,
    startWorkflow,   // <-- Importación nueva
    advanceWorkflow  // <-- Importación nueva
} = require('../controllers/documento.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../config/upload');

const router = Router();
router.use(authMiddleware);

// Rutas existentes para crear y listar documentos
router.route('/')
  .get(getAllDocumentos)
  .post(upload.single('archivo'), createDocumento);

// --- Rutas nuevas para la ejecución del workflow ---
router.post('/:id/start-workflow', startWorkflow);
router.post('/:id/advance-workflow', advanceWorkflow);

module.exports = router;