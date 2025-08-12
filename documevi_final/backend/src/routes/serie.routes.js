// Archivo: backend/src/routes/serie.routes.js
const { Router } = require('express');
const { getAllSeries, createSerie } = require('../controllers/serie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Proteger todas las rutas de series
router.use(authMiddleware);

router.get('/', [authMiddleware], getAllSeries);
router.post('/', [authMiddleware, authorizePermission('gestionar_parametros_trd')], createSerie);

module.exports = router;