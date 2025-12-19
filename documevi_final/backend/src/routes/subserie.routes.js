const { Router } = require('express');
const subserieController = require('../controllers/subserie.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

router.get('/', authorizePermission('subseries_ver'), subserieController.getAllSubseries);
router.post('/', authorizePermission('subseries_crear'), subserieController.createSubserie);

//Rutas para editar y cambiar estado
router.put('/:id', authorizePermission('subseries_editar'), subserieController.updateSubserie);
router.patch('/:id/toggle-status', authorizePermission('subseries_inactivar'), subserieController.toggleSubserieStatus);

// POST /api/subseries/bulk - Carga masiva de subseries desde Excel
// ✅ v1.2.0: Requiere el permiso 'subseries_crear'
router.post('/bulk', authorizePermission('subseries_crear'), subserieController.bulkCreateSubseries);

module.exports = router;