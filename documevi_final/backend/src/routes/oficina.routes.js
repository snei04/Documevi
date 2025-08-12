const { Router } = require('express');
const { getAllOficinas, createOficina } = require('../controllers/oficina.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission'); 

const router = Router();

router.use(authMiddleware);


router.get('/', [authMiddleware], getAllOficinas);
router.post('/', [authMiddleware, authorizePermission('gestionar_parametros_trd')], createOficina);

module.exports = router;