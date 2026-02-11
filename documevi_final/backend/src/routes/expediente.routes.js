const express = require('express');
const {
    getAllExpedientes,
    createExpediente,
    crearExpedienteCompleto,
    getExpedienteById,
    addDocumentoToExpediente,
    closeExpediente,
    getExpedienteCustomData,
    updateExpedienteCustomData,
    createDocumentoFromPlantillaInExpediente,
    validarDuplicados,
    anexarPorDuplicado,
    updateExpedienteFechas,
    searchByCustomField
} = require('../controllers/expediente.controller');

const protect = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');
const upload = require('../config/upload');

const router = express.Router();


router.use(protect);


router.route('/')
    .get(getAllExpedientes)  // Todos los usuarios autenticados pueden ver la lista
    .post(authorizePermission('expedientes_crear'), createExpediente);

// Nuevo endpoint unificado con soporte para archivo
router.post('/crear-completo',
    authorizePermission('expedientes_crear'),
    upload.single('archivo'),
    crearExpedienteCompleto
);

router.route('/validar-duplicados')
    .post(authorizePermission('expedientes_crear'), validarDuplicados);


router.route('/:id')
    .get(getExpedienteById);  // Todos pueden acceder, la lógica de permisos está en el controlador

router.route('/:id/fechas')
    .put(authorizePermission('editar_fechas_expediente'), updateExpedienteFechas);

router.route('/:id/cerrar')
    .put(authorizePermission('expedientes_cerrar'), closeExpediente);


router.route('/:id_expediente/documentos')
    .post(authorizePermission('expedientes_agregar_documentos'), addDocumentoToExpediente);


router.route('/:id/documentos-desde-plantilla')
    .post(authorizePermission('expedientes_agregar_documentos'), createDocumentoFromPlantillaInExpediente);


router.route('/:id/custom-data')
    .get(authorizePermission('expedientes_ver'), getExpedienteCustomData)
    .put(authorizePermission('expedientes_custom_data'), updateExpedienteCustomData);

router.route('/search-custom')
    .get(authorizePermission('expedientes_ver'), searchByCustomField);

router.route('/:id/anexar-por-duplicado')
    .post(authorizePermission('expedientes_agregar_documentos'), anexarPorDuplicado);

module.exports = router;