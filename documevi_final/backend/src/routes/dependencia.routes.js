const { Router } = require('express');

// 1. Importamos el controlador completo en una sola variable para mayor claridad
const dependenciaController = require('../controllers/dependencia.controller');

// Importamos los middlewares
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// --- Definición de Rutas ---

// Todas las rutas a partir de aquí requerirán que el usuario esté autenticado
router.use(authMiddleware);

// GET /api/dependencias - Obtener todas las dependencias
router.get('/', dependenciaController.getAllDependencias); 

// POST /api/dependencias - Crear una nueva dependencia
// Requiere el permiso 'gestionar_parametros_trd'
router.post('/', authorizePermission('gestionar_parametros_trd'), dependenciaController.createDependencia);

// PUT /api/dependencias/:id - Actualizar una dependencia
// ✅ SE AÑADIÓ SEGURIDAD: Requiere el permiso 'gestionar_parametros_trd'
router.put('/:id', authorizePermission('gestionar_parametros_trd'), dependenciaController.updateDependencia);

// PATCH /api/dependencias/:id/toggle-status - Cambiar el estado (activo/inactivo)
// ✅ SE AÑADIÓ SEGURIDAD: Requiere el permiso 'gestionar_parametros_trd'
router.patch('/:id/toggle-status', authorizePermission('gestionar_parametros_trd'), dependenciaController.toggleDependenciaStatus);

module.exports = router;