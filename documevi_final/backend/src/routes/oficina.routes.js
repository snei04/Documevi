const { Router } = require('express');
const { 
    getAllOficinas, 
    createOficina, 
    updateOficina, 
    toggleOficinaStatus,
    bulkCreateOficinas
} = require('../controllers/oficina.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission'); 

const router = Router();

// Aplica la autenticación a TODAS las rutas de este archivo
router.use(authMiddleware);

// Define las rutas
router.get('/', authorizePermission('oficinas_ver'), getAllOficinas);
router.post('/', authorizePermission('oficinas_crear'), createOficina);

// Nuevas rutas para editar y cambiar estado
router.put('/:id', authorizePermission('oficinas_editar'), updateOficina);
router.patch('/:id/toggle-status', authorizePermission('oficinas_inactivar'), toggleOficinaStatus);

// POST /api/oficinas/bulk - Carga masiva de oficinas desde Excel
// ✅ v1.2.0: Requiere el permiso 'oficinas_crear'
router.post('/bulk', authorizePermission('oficinas_crear'), bulkCreateOficinas);

module.exports = router;