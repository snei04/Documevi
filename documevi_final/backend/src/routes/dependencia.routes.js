/**
 * @fileoverview Rutas de la API para gestión de dependencias.
 * Define los endpoints CRUD para dependencias organizacionales.
 * Todas las rutas requieren autenticación y permisos específicos.
 * 
 * @module routes/dependencia
 * @requires express
 * @requires ../controllers/dependencia.controller
 * @requires ../middleware/auth.middleware
 * @requires ../middleware/authorizePermission
 */

const { Router } = require('express');
const dependenciaController = require('../controllers/dependencia.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// ============================================
// MIDDLEWARE GLOBAL: Autenticación requerida
// ============================================
// Todas las rutas de este módulo requieren usuario autenticado
router.use(authMiddleware);

// ============================================
// RUTAS DE DEPENDENCIAS
// ============================================

/**
 * @route   GET /api/dependencias
 * @desc    Obtiene la lista de todas las dependencias
 * @access  Privado - Requiere permiso 'dependencias_ver'
 */
router.get('/', authorizePermission('dependencias_ver'), dependenciaController.getAllDependencias); 

/**
 * @route   POST /api/dependencias
 * @desc    Crea una nueva dependencia
 * @access  Privado - Requiere permiso 'dependencias_crear'
 */
router.post('/', authorizePermission('dependencias_crear'), dependenciaController.createDependencia);

/**
 * @route   POST /api/dependencias/bulk
 * @desc    Carga masiva de dependencias desde archivo Excel
 * @access  Privado - Requiere permiso 'dependencias_crear'
 */
router.post('/bulk', authorizePermission('dependencias_crear'), dependenciaController.bulkCreateDependencias);

/**
 * @route   PUT /api/dependencias/:id
 * @desc    Actualiza una dependencia existente
 * @param   {string} id - ID de la dependencia a actualizar
 * @access  Privado - Requiere permiso 'dependencias_editar'
 */
router.put('/:id', authorizePermission('dependencias_editar'), dependenciaController.updateDependencia);

/**
 * @route   PATCH /api/dependencias/:id/toggle-status
 * @desc    Cambia el estado activo/inactivo de una dependencia
 * @param   {string} id - ID de la dependencia
 * @access  Privado - Requiere permiso 'dependencias_inactivar'
 */
router.patch('/:id/toggle-status', authorizePermission('dependencias_inactivar'), dependenciaController.toggleDependenciaStatus);

module.exports = router;