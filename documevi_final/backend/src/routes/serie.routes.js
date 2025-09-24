// En src/routes/serie.routes.js
const { Router } = require('express');
const serieController = require('../controllers/serie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

router.get('/', serieController.getAllSeries);
router.post('/', authorizePermission('gestionar_parametros_trd'), serieController.createSerie);

// ✅ Rutas para editar y cambiar estado
router.put('/:id', authorizePermission('gestionar_parametros_trd'), serieController.updateSerie);
router.patch('/:id/toggle-status', authorizePermission('gestionar_parametros_trd'), serieController.toggleSerieStatus);

module.exports = router;