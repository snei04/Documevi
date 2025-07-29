const { Router } = require('express');
const { getDashboardStats, getDocsPorOficina } = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger la ruta
router.get('/', authMiddleware, getDashboardStats);

router.get('/docs-por-oficina', getDocsPorOficina);

module.exports = router;