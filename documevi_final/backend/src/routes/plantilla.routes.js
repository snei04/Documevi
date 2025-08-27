// Archivo: backend/src/routes/plantilla.routes.js
const { Router } = require('express');
const { 
    getAllPlantillas, 
    createPlantilla, 
    getPlantillaWithCampos, 
    addCampoToPlantilla 
} = require('../controllers/plantilla.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Cualquiera puede ver la lista de plantillas
router.get('/', getAllPlantillas);
router.get('/:id', getPlantillaWithCampos);

// SOLO usuarios con el permiso 'gestionar_plantillas' pueden crear y modificar
router.post('/', authorizePermission('gestionar_plantillas'), createPlantilla);
router.post('/:id/campos', authorizePermission('gestionar_plantillas'), addCampoToPlantilla);

module.exports = router;