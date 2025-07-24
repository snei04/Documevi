// Archivo: backend/src/routes/prestamo.routes.js
const { Router } = require('express');
const { createPrestamo, getAllPrestamos, updatePrestamoStatus } = require('../controllers/prestamo.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Proteger todas las rutas
router.use(authMiddleware);

router.route('/')
  .post(createPrestamo)
  .get(getAllPrestamos);

router.route('/:id/status')
  .put(updatePrestamoStatus); // PUT /api/prestamos/1/status

module.exports = router;