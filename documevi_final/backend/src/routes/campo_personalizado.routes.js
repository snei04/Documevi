const { Router } = require('express');
const { getCamposPorOficina, createCampo } = require('../controllers/campo_personalizado.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
// Protegemos todas las rutas con autenticación
router.use(authMiddleware);

router.route('/oficina/:id_oficina')
    .get(authorizePermission(['campos_ver', 'expedientes_ver']), getCamposPorOficina)
    .post(authorizePermission('campos_crear'), createCampo);

module.exports = router;