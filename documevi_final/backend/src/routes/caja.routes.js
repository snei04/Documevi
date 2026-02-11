const { Router } = require('express');
const {
    createCaja,
    getCajas,
    getCajaById,
    updateCaja
} = require('../controllers/caja.controller');
const authorizePermission = require('../middleware/authorizePermission');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();
router.use(authMiddleware);

router.route('/')
    .get(getCajas) // Permiso abierto a autenticados o restringir? Dejemos abierto por ahora o 'documentos_ver'
    .post(authorizePermission('carpetas_crear'), createCaja); // Reusamos permiso de carpetas

router.route('/:id')
    .get(getCajaById)
    .put(authorizePermission('carpetas_crear'), updateCaja);

module.exports = router;
