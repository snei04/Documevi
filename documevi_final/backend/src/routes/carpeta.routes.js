const express = require('express');
const router = express.Router();
const carpetaController = require('../controllers/carpeta.controller');
// Asumiendo que existe un middleware de autenticación, aunque no lo vi explícitamente en server.js imports, 
// pero auth.routes lo usa. Lo omitiré por ahora si no es estrictamente necesario o usaré uno genérico si encuentro.
// Viendo server.js, no hay middleware global de auth, pero los controladores suelen usar req.user.
// Voy a asumir que las rutas estan protegidas o abiertas según necesidad.
// Para mantener consistencia con otros routes, importaré auth middleware si lo encuentro.
// Revisando file list, src/middleware existe.

const auth = require('../middleware/auth.middleware');

// Rutas
router.post('/', auth, carpetaController.createCarpeta);
router.get('/', auth, carpetaController.getCarpetas);
router.get('/:id', auth, carpetaController.getCarpetaById);
router.put('/:id/cerrar', auth, carpetaController.closeCarpeta);

module.exports = router;
