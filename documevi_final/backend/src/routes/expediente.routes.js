const express = require('express');
const { 
    getAllExpedientes, 
    createExpediente,
    getExpedienteById,         
    addDocumentoToExpediente,
    closeExpediente,
    getExpedienteCustomData,
    updateExpedienteCustomData,
    
    createDocumentoFromPlantillaInExpediente 
} = require('../controllers/expediente.controller');

const protect = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = express.Router();


router.use(protect);


router.route('/')
    .get(getAllExpedientes)
    .post(authorizePermission('crear_expedientes'), createExpediente);


router.route('/:id')
    .get(getExpedienteById);

router.route('/:id/cerrar')
    .put(authorizePermission('cerrar_expedientes'), closeExpediente);


router.route('/:id_expediente/documentos')
    .post(authorizePermission('gestionar_expedientes'), addDocumentoToExpediente);


router.route('/:id/documentos-desde-plantilla')
    .post(authorizePermission('gestionar_expedientes'), createDocumentoFromPlantillaInExpediente);


router.route('/:id/custom-data')
    .get(getExpedienteCustomData)
    .put(authorizePermission('gestionar_expedientes'), updateExpedienteCustomData);

module.exports = router;