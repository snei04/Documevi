// Archivo: backend/src/routes/subserie.routes.js
const { Router } = require('express');
const { getAllSubseries, createSubserie } = require('../controllers/subserie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Proteger todas las rutas
router.use(authMiddleware);

router.get('/', [authMiddleware], getAllSubseries);
router.post('/', [authMiddleware, authorizePermission('gestionar_parametros_trd')], createSubserie);

module.exports = router;