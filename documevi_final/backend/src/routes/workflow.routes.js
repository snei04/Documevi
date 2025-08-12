// Archivo: backend/src/routes/workflow.routes.js
const { Router } = require('express');
const { 
  getAllWorkflows, 
  createWorkflow, 
  getWorkflowPasos, 
  createWorkflowPaso, 
  getWorkflowById, 
  getMyTasks 
} = require('../controllers/workflow.controller');
const authMiddleware = require('../middleware/auth.middleware');
// 👇 1. Importamos el nuevo middleware de permisos
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Protegemos todas las rutas con autenticación
router.use(authMiddleware);

// --- Rutas ---

// Cualquiera puede ver la lista de workflows y sus tareas
router.get('/', getAllWorkflows);
router.get('/tareas', getMyTasks);
router.get('/:id', getWorkflowById);
router.get('/:id/pasos', getWorkflowPasos);

// 👇 2. SOLO los usuarios con el permiso específico pueden CREAR workflows y PASOS
router.post('/', authorizePermission('gestionar_workflows'), createWorkflow);
router.post('/:id/pasos', authorizePermission('gestionar_workflows'), createWorkflowPaso);

module.exports = router;