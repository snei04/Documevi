const { Router } = require('express');
const { getDashboardStats } = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger la ruta
router.get('/', authMiddleware, getDashboardStats);

module.exports = router;