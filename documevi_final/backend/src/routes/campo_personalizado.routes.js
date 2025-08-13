const { Router } = require('express');
const { getCamposPorOficina, createCampo } = require('../controllers/campo_personalizado.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
// Asumimos que gestionar campos personalizados es parte de la TRD
router.use(authMiddleware, authorizePermission('gestionar_parametros_trd'));

router.route('/oficina/:id_oficina')
    .get(getCamposPorOficina)
    .post(createCampo);

module.exports = router;