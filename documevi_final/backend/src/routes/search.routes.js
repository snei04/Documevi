// Archivo: backend/src/routes/search.routes.js
const { Router } = require('express');
const { search } = require('../controllers/search.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Proteger la ruta de búsqueda
router.get('/', authorizePermission('busqueda_basica'), search);

module.exports = router;