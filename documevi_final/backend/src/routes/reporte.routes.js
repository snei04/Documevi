const { Router } = require('express');
const { generateFUID } = require('../controllers/reporte.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Proteger la ruta
router.get('/fuid', authorizePermission('reportes_fuid'), generateFUID);

module.exports = router;