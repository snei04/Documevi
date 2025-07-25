const { Router } = require('express');
const { getAllOficinas, createOficina } = require('../controllers/oficina.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

router.use(authMiddleware);


router.get('/', [authMiddleware, authorizeRoles(1, 2)], getAllOficinas);
router.post('/', [authMiddleware, authorizeRoles(1)], createOficina);

module.exports = router;