// Archivo: backend/src/routes/subserie.routes.js
const { Router } = require('express');
const { getAllSubseries, createSubserie } = require('../controllers/subserie.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger todas las rutas
router.use(authMiddleware);

router.get('/', getAllSubseries);
router.post('/', createSubserie);

module.exports = router;