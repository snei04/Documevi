const { Router } = require('express');
const { 
  getAllExpedientes, 
  createExpediente,
  getExpedienteById,          
  addDocumentoToExpediente     
} = require('../controllers/expediente.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

// Rutas para la colección de expedientes
router.route('/')
  .get(getAllExpedientes)
  .post(createExpediente);

// Ruta para un expediente específico por ID
router.route('/:id')
  .get(getExpedienteById);

// Ruta para añadir documentos a un expediente
router.route('/:id_expediente/documentos')
  .post(addDocumentoToExpediente);

module.exports = router;