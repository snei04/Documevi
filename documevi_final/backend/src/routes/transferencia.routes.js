// Archivo: backend/src/routes/transferencia.routes.js
const { Router } = require('express');
const { realizarTransferencia } = require('../controllers/transferencia.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Rutas para transferencias documentales
router.post('/', authorizePermission('transferencias_ejecutar'), realizarTransferencia);

module.exports = router;