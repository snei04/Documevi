const { Router } = require('express');
const { check } = require('express-validator');
const { setPassword, registerUser, loginUser, getAuthenticatedUser } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Ruta para registrar un nuevo usuario
router.post(
  '/register',
  [
    check('nombre_completo', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('rol_id', 'El rol es obligatorio').isInt(),
  ],
  registerUser
);

// Ruta para iniciar sesión
router.post(
  '/login',
  [
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
  ],
  loginUser
);
router.post('/set-password', setPassword); // Nueva ruta

// GET /api/auth/me - Devuelve el usuario actual
router.get('/me', authMiddleware, getAuthenticatedUser); // <-- 2. AHORA ESTA LÍNEA FUNCIONARÁ

module.exports = router;