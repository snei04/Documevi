const { Router } = require('express');
const { getAllOficinas, createOficina } = require('../controllers/oficina.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);


router.get('/', getAllOficinas);
router.post('/', createOficina);

module.exports = router;