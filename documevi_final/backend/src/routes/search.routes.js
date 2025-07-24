// Archivo: backend/src/routes/search.routes.js
const { Router } = require('express');
const { search } = require('../controllers/search.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger la ruta de búsqueda
router.get('/', authMiddleware, search);

module.exports = router;