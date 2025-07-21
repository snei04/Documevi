// Archivo: backend/src/routes/documento.routes.js
const { Router } = require('express');
const { createDocumento } = require('../controllers/documento.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger todas las rutas de documentos
router.use(authMiddleware);

// POST /api/documentos - Radicar un nuevo documento
router.post('/', createDocumento);

module.exports = router;