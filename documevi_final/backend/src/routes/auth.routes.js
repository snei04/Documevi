const { Router } = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

router.post(
  '/register',
  [
    authMiddleware, // Primero verifica que el usuario esté autenticado
    authorizePermission('usuarios_crear'), // Luego, que tenga el permiso para crear usuarios
    // Validaciones (se mantienen igual)
    check('nombre_completo', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
    check('rol_id', 'El rol es obligatorio').isInt(),
  ],
  authController.registerUser // Ahora la llamada es correcta
);

// Ruta para iniciar sesión
router.post(
  '/login',
  [
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
  ],
  authController.loginUser // La llamada es correcta
);

// Ruta para el primer seteo de contraseña
router.post('/set-password', authController.setPassword);

// Ruta para obtener el usuario autenticado
router.get('/me', authMiddleware, authController.getAuthenticatedUser);

// Rutas para recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Ruta para cerrar sesión
router.post('/logout', authController.logoutUser);

module.exports = router;