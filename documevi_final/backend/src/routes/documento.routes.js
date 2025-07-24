const { Router } = require('express');
// 👇 1. Asegúrate de importar ambas funciones del controlador
const { createDocumento, getAllDocumentos } = require('../controllers/documento.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../config/upload');

const router = Router();

router.use(authMiddleware);

// 2. Ahora que las funciones están importadas, esto funcionará
router.route('/')
  .get(getAllDocumentos)
  .post(upload.single('archivo'), createDocumento);

module.exports = router;