// Archivo: backend/src/routes/subserie.routes.js
const { Router } = require('express');
const { getAllSubseries, createSubserie } = require('../controllers/subserie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

// Proteger todas las rutas
router.use(authMiddleware);

router.get('/', [authMiddleware, authorizeRoles(1, 2)], getAllSubseries);
router.post('/', [authMiddleware, authorizeRoles(1)], createSubserie);

module.exports = router;