// Archivo: backend/src/routes/auth.routes.js

const { Router } = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/auth.controller');

const router = Router();

// Ruta para registrar un nuevo usuario
// POST /api/auth/register
router.post(
  '/register',
  [
    // Validadores de ingreso
    check('nombre_completo', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('rol_id', 'El rol es obligatorio').isInt(),
  ],
  registerUser
);

// Ruta para iniciar sesión
// POST /api/auth/login
router.post(
  '/login',
  [
    check('documento', 'El documento es obligatorio').not().isEmpty(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
  ],
  loginUser
);

module.exports = router;