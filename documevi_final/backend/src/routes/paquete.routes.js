const express = require('express');
const {
    getAllPaquetes,
    getPaqueteActivo,
    asignarExpediente,
    marcarLleno,
    reabrirPaquete,
    getExpedientesPaquete
} = require('../controllers/paquete.controller');

const protect = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = express.Router();

router.use(protect);

// Listar todos los paquetes (filtrar por oficina con ?id_oficina=X)
router.get('/', getAllPaquetes);

// Obtener paquete activo de una oficina (crea uno si no existe)
router.get('/activo/:id_oficina', getPaqueteActivo);

// Asignar expediente a paquete
router.post('/asignar-expediente', asignarExpediente);

// Marcar paquete como lleno (crea el siguiente automáticamente)
router.post('/:id/marcar-lleno', marcarLleno);

// Reabrir un paquete cerrado
router.post('/:id/reabrir', reabrirPaquete);

// Ver expedientes de un paquete
router.get('/:id/expedientes', getExpedientesPaquete);

module.exports = router;
