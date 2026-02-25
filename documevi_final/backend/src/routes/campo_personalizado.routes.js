const { Router } = require('express');
const { getCamposPorOficina, createCampo, updateCampo, deleteCampo } = require('../controllers/campo_personalizado.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
// Protegemos todas las rutas con autenticación
router.use(authMiddleware);

router.route('/oficina/:id_oficina')
    .get(authorizePermission(['campos_ver', 'expedientes_ver']), getCamposPorOficina)
    .post(authorizePermission('campos_crear'), createCampo);

router.route('/:id')
    .put(authorizePermission('campos_editar'), updateCampo)
    .delete(authorizePermission('campos_eliminar'), deleteCampo);

module.exports = router;