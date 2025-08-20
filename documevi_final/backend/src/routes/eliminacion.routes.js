const { Router } = require('express');
const { getExpedientesElegibles, eliminarExpedientes } = require('../controllers/eliminacion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Asumimos un nuevo permiso 'gestionar_disposicion_final'
router.use(authMiddleware, authorizePermission('gestionar_disposicion_final'));

router.get('/elegibles', getExpedientesElegibles);
router.post('/ejecutar', eliminarExpedientes);

module.exports = router;