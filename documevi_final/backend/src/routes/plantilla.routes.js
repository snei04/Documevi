// src/routes/plantilla.routes.js

const { Router } = require('express');

const {
    getAllPlantillas,
    getPlantillaWithCampos,
    createPlantilla,
    updatePlantilla,
    deletePlantilla,
    addCampoToPlantilla,
    updateCampoPlantilla,
    deleteCampoPlantilla,
    updateDisenoPlantilla,
    uploadBackgroundImage,
    getVariablesDisponibles
} = require('../controllers/plantilla.controller');

const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');
const upload = require('../config/upload');

const router = Router();

// --- Definición de Rutas ---

// ✅ RUTA PROTEGIDA: Requiere autenticación y permiso para ver plantillas
router.get('/', authMiddleware, authorizePermission(['plantillas_ver', 'expedientes_ver']), getAllPlantillas);

// ✅ RUTAS PROTEGIDAS: A partir de aquí, todas las rutas requerirán autenticación.
// Se añade el 'authMiddleware' a cada una de las rutas que necesitan protección.

// Rutas para ver datos específicos (requiere estar logueado)
router.get('/:id/variables', authMiddleware, authorizePermission(['plantillas_ver', 'expedientes_ver']), getVariablesDisponibles);
router.get('/:id', authMiddleware, authorizePermission(['plantillas_ver', 'expedientes_ver']), getPlantillaWithCampos);

// Rutas para crear y modificar (requiere estar logueado Y tener permisos)
router.post('/', [authMiddleware, authorizePermission('plantillas_crear')], createPlantilla);
router.post('/:id/campos', [authMiddleware, authorizePermission('plantillas_editar')], addCampoToPlantilla);

// Editar y eliminar plantillas
router.put('/:id', [authMiddleware, authorizePermission('plantillas_editar')], updatePlantilla);
router.delete('/:id', [authMiddleware, authorizePermission('plantillas_eliminar')], deletePlantilla);

// Editar y eliminar campos de plantilla
router.put('/:id/campos/:id_campo', [authMiddleware, authorizePermission('plantillas_editar')], updateCampoPlantilla);
router.delete('/:id/campos/:id_campo', [authMiddleware, authorizePermission('plantillas_eliminar')], deleteCampoPlantilla);

// Rutas para el diseñador visual (requiere estar logueado)
router.post('/:id/diseno', authMiddleware, authorizePermission('plantillas_disenar'), updateDisenoPlantilla);
router.post('/:id/background', [authMiddleware, authorizePermission('plantillas_disenar'), upload.single('background')], uploadBackgroundImage);


module.exports = router;