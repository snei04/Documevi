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
// ✅ SE AÑADIÓ SEGURIDAD: Requiere estar autenticado y tener permiso de ver
router.get('/', authorizePermission('dependencias_ver'), dependenciaController.getAllDependencias); 

// POST /api/dependencias - Crear una nueva dependencia
// Requiere el permiso 'dependencias_crear'
router.post('/', authorizePermission('dependencias_crear'), dependenciaController.createDependencia);

// PUT /api/dependencias/:id - Actualizar una dependencia
// ✅ SE AÑADIÓ SEGURIDAD: Requiere el permiso 'dependencias_editar'
router.put('/:id', authorizePermission('dependencias_editar'), dependenciaController.updateDependencia);

// PATCH /api/dependencias/:id/toggle-status - Cambiar el estado (activo/inactivo)
// ✅ SE AÑADIÓ SEGURIDAD: Requiere el permiso 'dependencias_inactivar'
router.patch('/:id/toggle-status', authorizePermission('dependencias_inactivar'), dependenciaController.toggleDependenciaStatus);

// POST /api/dependencias/bulk - Carga masiva de dependencias desde Excel
// ✅ v1.2.0: Requiere el permiso 'dependencias_crear'
router.post('/bulk', authorizePermission('dependencias_crear'), dependenciaController.bulkCreateDependencias);

module.exports = router;