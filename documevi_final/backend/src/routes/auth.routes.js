const { Router } = require('express');
const { check } = require('express-validator');

// 1. Importamos el controlador completo en una sola variable
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();



router.post(
  '/register',
  [
    check('nombre_completo', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
    check('rol_id', 'El rol es obligatorio').isInt(),
  ],
  
  authController.registerUser
);

// Ruta para iniciar sesión
router.post(
  '/login',
  [
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
  ],
  authController.loginUser
);

// Ruta para el primer seteo de contraseña
router.post('/set-password', authController.setPassword);

// Ruta para obtener el usuario autenticado
router.get('/me', authMiddleware, authController.getAuthenticatedUser);

// Rutas para recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);


module.exports = router;