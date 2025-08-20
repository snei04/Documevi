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

// Rutas para gestionar las plantillas (solo administradores de TRD)
router.route('/')
    .get(getAllPlantillas)
    .post(authorizePermission('gestionar_parametros_trd'), createPlantilla);

// Rutas para una plantilla específica y sus campos
router.route('/:id')
    .get(getPlantillaWithCampos);

router.route('/:id/campos')
    .post(authorizePermission('gestionar_parametros_trd'), addCampoToPlantilla);

module.exports = router;