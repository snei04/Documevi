const { Router } = require('express');
const { getAllRoles } = require('../controllers/rol.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = Router();
router.get('/', authMiddleware, getAllRoles);
module.exports = router;