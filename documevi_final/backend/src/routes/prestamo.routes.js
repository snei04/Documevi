const { Router } = require('express');
const { 
    createPrestamo, 
    getAllPrestamos, 
    approvePrestamo,
    returnPrestamo,
    requestProrroga, 
    approveProrroga,
    getMyPrestamos 
} = require('../controllers/prestamo.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();
router.use(authMiddleware);

// Rutas para la colección de préstamos
router.route('/')
  .post(authorizePermission('prestamos_solicitar'), createPrestamo)
  .get(authorizePermission('prestamos_ver'), getAllPrestamos);

// Rutas para acciones específicas del administrador
router.put('/:id/approve', authorizePermission('prestamos_aprobar'), approvePrestamo);
router.put('/:id/return', authorizePermission('prestamos_devolver'), returnPrestamo);
router.put('/:id/approve-prorroga', authorizePermission('prestamos_prorrogar'), approveProrroga);


// Ruta para que un usuario solicite una prórroga
router.put('/:id/request-prorroga', requestProrroga);
router.get('/mis-prestamos', getMyPrestamos);

module.exports = router;