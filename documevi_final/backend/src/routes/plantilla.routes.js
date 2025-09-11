// src/routes/plantilla.routes.js

const { Router } = require('express');

const { 
    getAllPlantillas, 
    getPlantillaWithCampos,
    createPlantilla, 
    addCampoToPlantilla,
    updateDisenoPlantilla,
    uploadBackgroundImage,
    getVariablesDisponibles
} = require('../controllers/plantilla.controller');

const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');
const upload = require('../config/upload'); 

const router = Router();

// --- Definición de Rutas ---

// ✅ RUTA PÚBLICA: No lleva ningún middleware de autenticación.
// Cualquiera puede ver la lista de plantillas.
router.get('/', getAllPlantillas);

// ✅ RUTAS PROTEGIDAS: A partir de aquí, todas las rutas requerirán autenticación.
// Se añade el 'authMiddleware' a cada una de las rutas que necesitan protección.

// Rutas para ver datos específicos (requiere estar logueado)
router.get('/:id/variables', authMiddleware, getVariablesDisponibles);
router.get('/:id', authMiddleware, getPlantillaWithCampos);

// Rutas para crear y modificar (requiere estar logueado Y tener permisos)
router.post('/', [authMiddleware, authorizePermission('gestionar_plantillas')], createPlantilla);
router.post('/:id/campos', [authMiddleware, authorizePermission('gestionar_plantillas')], addCampoToPlantilla);

// Rutas para el diseñador visual (requiere estar logueado)
router.post('/:id/diseno', authMiddleware, updateDisenoPlantilla);
router.post('/:id/background', [authMiddleware, upload.single('background')], uploadBackgroundImage);


module.exports = router;