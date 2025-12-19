// Archivo: backend/src/routes/search.routes.js
const { Router } = require('express');
const { search, advancedSearch, getSearchableCustomFields } = require('../controllers/search.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Búsqueda básica
router.get('/', authorizePermission('busqueda_basica'), search);

// Búsqueda avanzada con filtros
router.get('/avanzada', authorizePermission('busqueda_avanzada'), advancedSearch);

// Obtener campos personalizados disponibles para búsqueda
router.get('/campos-personalizados', authorizePermission('busqueda_avanzada'), getSearchableCustomFields);

module.exports = router;