// En src/routes/serie.routes.js
const { Router } = require('express');
const serieController = require('../controllers/serie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

router.get('/', authorizePermission('series_ver'), serieController.getAllSeries);
router.post('/', authorizePermission('series_crear'), serieController.createSerie);

// ✅ Rutas para editar y cambiar estado
router.put('/:id', authorizePermission('series_editar'), serieController.updateSerie);
router.patch('/:id/toggle-status', authorizePermission('series_inactivar'), serieController.toggleSerieStatus);

module.exports = router;