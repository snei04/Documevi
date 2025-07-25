// Archivo: backend/src/routes/serie.routes.js
const { Router } = require('express');
const { getAllSeries, createSerie } = require('../controllers/serie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Proteger todas las rutas de series
router.use(authMiddleware);

router.get('/', [authMiddleware, authorizeRoles(1, 2)], getAllSeries);
router.post('/', [authMiddleware, authorizeRoles(1)], createSerie);

module.exports = router;