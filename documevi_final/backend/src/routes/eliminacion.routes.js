const { Router } = require('express');
const { getExpedientesElegibles, eliminarExpedientes } = require('../controllers/eliminacion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

router.get('/elegibles', authorizePermission('eliminacion_ver'), getExpedientesElegibles);
router.post('/ejecutar', authorizePermission('eliminacion_ejecutar'), eliminarExpedientes);

module.exports = router;