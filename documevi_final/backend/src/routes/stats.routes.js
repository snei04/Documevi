const { Router } = require('express');
const { getDashboardStats, getDocsPorOficina } = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Proteger la ruta
router.get('/', authorizePermission('estadisticas_ver'), getDashboardStats);
router.get('/docs-por-oficina', authorizePermission('estadisticas_ver'), getDocsPorOficina);

module.exports = router;