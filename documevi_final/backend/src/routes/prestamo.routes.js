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
  .post(createPrestamo)
  .get(authorizePermission('gestionar_prestamos'), getAllPrestamos);

// Rutas para acciones específicas del administrador
router.put('/:id/approve', authorizePermission('gestionar_prestamos'), approvePrestamo);
router.put('/:id/return', authorizePermission('gestionar_prestamos'), returnPrestamo);
router.put('/:id/approve-prorroga', authorizePermission('gestionar_prestamos'), approveProrroga);


// Ruta para que un usuario solicite una prórroga
router.put('/:id/request-prorroga', requestProrroga);
router.get('/mis-prestamos', getMyPrestamos);

module.exports = router;