const { Router } = require('express');
const { 
  getAllExpedientes, 
  createExpediente,
  getExpedienteById,          
  addDocumentoToExpediente,
  closeExpediente,
  getExpedienteCustomData,
  updateExpedienteCustomData,
  createDocumentoFromPlantilla  
} = require('../controllers/expediente.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

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

router.route('/:id/cerrar')
  .put(closeExpediente);

  router.route('/:id/custom-data')
  .get(getExpedienteCustomData)
  .put(authorizePermission('gestionar_expedientes'), updateExpedienteCustomData);
  router.post('/:id/documentos-desde-plantilla', authorizePermission('gestionar_expedientes'), createDocumentoFromPlantilla);

module.exports = router;