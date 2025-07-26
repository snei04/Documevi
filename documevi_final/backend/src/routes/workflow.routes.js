// Archivo: backend/src/routes/workflow.routes.js
const { Router } = require('express');
const { getAllWorkflows, createWorkflow, getWorkflowPasos, createWorkflowPaso, getWorkflowById, getMyTasks  } = require('../controllers/workflow.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger todas las rutas
router.use(authMiddleware);

// Ruta para obtener las tareas del usuario logueado
router.get('/tareas', getMyTasks);

// Rutas para la colección de workflows
router.route('/')
  .get(getAllWorkflows)
  .post(createWorkflow);

// Rutas para los pasos de un workflow específico
router.route('/:id/pasos')
  .get(getWorkflowPasos)
  .post(createWorkflowPaso);

// Ruta para obtener un workflow por ID
router.route('/:id')
  .get(getWorkflowById);


module.exports = router;