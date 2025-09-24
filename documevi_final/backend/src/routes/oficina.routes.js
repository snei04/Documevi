const { Router } = require('express');
const { 
    getAllOficinas, 
    createOficina, 
    updateOficina, 
    toggleOficinaStatus 
} = require('../controllers/oficina.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission'); 

const router = Router();

// Aplica la autenticación a TODAS las rutas de este archivo
router.use(authMiddleware);

// Define las rutas
router.get('/', getAllOficinas);
router.post('/', authorizePermission('gestionar_parametros_trd'), createOficina);

// Nuevas rutas para editar y cambiar estado
router.put('/:id', authorizePermission('gestionar_parametros_trd'), updateOficina);
router.patch('/:id/toggle-status', authorizePermission('gestionar_parametros_trd'), toggleOficinaStatus);

module.exports = router;