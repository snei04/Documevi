const { Router } = require('express');
const { generateFUID } = require('../controllers/reporte.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger la ruta
router.get('/fuid', authMiddleware, generateFUID);

module.exports = router;