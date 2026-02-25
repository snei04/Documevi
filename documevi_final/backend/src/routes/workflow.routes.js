// Archivo: backend/src/routes/workflow.routes.js
const { Router } = require('express');
const {
  getAllWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowPasos,
  createWorkflowPaso,
  updateWorkflowPaso,
  deleteWorkflowPaso,
  getWorkflowById,
  getMyTasks
} = require('../controllers/workflow.controller');
const authMiddleware = require('../middleware/auth.middleware');
//  Importamos el nuevo middleware de permisos
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Protegemos todas las rutas con autenticación
router.use(authMiddleware);

// --- Rutas ---

// Rutas que solo requieren autenticación (cualquier usuario logueado puede ver)
router.get('/', authorizePermission(['workflows_ver', 'expedientes_ver']), getAllWorkflows);
router.get('/tareas', getMyTasks); // Ruta para obtener tareas del usuario (solo requiere autenticación)
router.get('/:id', authorizePermission(['workflows_ver', 'expedientes_ver']), getWorkflowById);
router.get('/:id/pasos', authorizePermission(['workflows_ver', 'expedientes_ver']), getWorkflowPasos);

// SOLO los usuarios con el permiso específico pueden CREAR workflows y PASOS
router.post('/', authorizePermission('workflows_crear'), createWorkflow);
router.post('/:id/pasos', authorizePermission('workflows_crear'), createWorkflowPaso);

// EDITAR workflows y pasos
router.put('/:id', authorizePermission('workflows_editar'), updateWorkflow);
router.put('/:id/pasos/:id_paso', authorizePermission('workflows_editar'), updateWorkflowPaso);

// ELIMINAR workflows y pasos
router.delete('/:id', authorizePermission('workflows_eliminar'), deleteWorkflow);
router.delete('/:id/pasos/:id_paso', authorizePermission('workflows_eliminar'), deleteWorkflowPaso);

module.exports = router;