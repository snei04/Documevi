const express = require('express');
const { 
    getAllExpedientes, 
    createExpediente,
    getExpedienteById,         
    addDocumentoToExpediente,
    closeExpediente,
    getExpedienteCustomData,
    updateExpedienteCustomData,
    createDocumentoFromPlantillaInExpediente,
    validarDuplicados,
    anexarPorDuplicado
} = require('../controllers/expediente.controller');

const protect = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = express.Router();


router.use(protect);


router.route('/')
    .get(getAllExpedientes)  // Todos los usuarios autenticados pueden ver la lista
    .post(authorizePermission('expedientes_crear'), createExpediente);

router.route('/validar-duplicados')
    .post(authorizePermission('expedientes_crear'), validarDuplicados);


router.route('/:id')
    .get(getExpedienteById);  // Todos pueden acceder, la lógica de permisos está en el controlador

router.route('/:id/cerrar')
    .put(authorizePermission('expedientes_cerrar'), closeExpediente);


router.route('/:id_expediente/documentos')
    .post(authorizePermission('expedientes_agregar_documentos'), addDocumentoToExpediente);


router.route('/:id/documentos-desde-plantilla')
    .post(authorizePermission('expedientes_agregar_documentos'), createDocumentoFromPlantillaInExpediente);


router.route('/:id/custom-data')
    .get(authorizePermission('expedientes_ver'), getExpedienteCustomData)
    .put(authorizePermission('expedientes_custom_data'), updateExpedienteCustomData);

router.route('/:id/anexar-por-duplicado')
    .post(authorizePermission('expedientes_agregar_documentos'), anexarPorDuplicado);

module.exports = router;