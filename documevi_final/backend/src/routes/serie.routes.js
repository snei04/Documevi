// Archivo: backend/src/routes/serie.routes.js
const { Router } = require('express');
const { getAllSeries, createSerie } = require('../controllers/serie.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger todas las rutas de series
router.use(authMiddleware);

router.get('/', getAllSeries);
router.post('/', createSerie);

module.exports = router;