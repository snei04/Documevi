const { Router } = require('express');
const subserieController = require('../controllers/subserie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

router.get('/', subserieController.getAllSubseries);
router.post('/', authorizePermission('gestionar_parametros_trd'), subserieController.createSubserie);

// ✅ Rutas para editar y cambiar estado
router.put('/:id', authorizePermission('gestionar_parametros_trd'), subserieController.updateSubserie);
router.patch('/:id/toggle-status', authorizePermission('gestionar_parametros_trd'), subserieController.toggleSubserieStatus);

module.exports = router;