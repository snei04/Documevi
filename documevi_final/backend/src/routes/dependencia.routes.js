// Archivo: backend/src/routes/dependencia.routes.js
const { Router } = require('express');
const { getAllDependencias, createDependencia } = require('../controllers/dependencia.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// GET /api/dependencias - Obtener todas las dependencias
router.get('/',authMiddleware, getAllDependencias);

// POST /api/dependencias - Crear una nueva dependencia
router.post('/', authMiddleware, createDependencia);

module.exports = router;