// En: routes/usuario.routes.js

const { Router } = require('express');
const { 
    getAllUsers, 
    updateUser, 
    inviteUser,
    getPerfilUsuario, // 1. Importamos la nueva función del controlador
    updatePerfil,     // 2. Nueva función para actualizar perfil
    changePassword    // 3. Nueva función para cambiar contraseña
} = require('../controllers/usuario.controller'); 
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// --- RUTAS QUE SOLO REQUIEREN AUTENTICACIÓN ---
// Cualquier usuario logueado puede consultar su propio perfil.
router.get('/perfil', authMiddleware, getPerfilUsuario);

// Ruta para que el usuario actualice sus propios datos (solo nombre)
router.put('/perfil', authMiddleware, updatePerfil);

// Ruta para que el usuario cambie su propia contraseña
router.put('/cambiar-password', authMiddleware, changePassword);


// --- RUTAS QUE REQUIEREN PERMISOS DE ADMINISTRADOR ---
// Para las siguientes rutas, el usuario no solo debe estar autenticado, 
// sino que también debe tener el permiso 'gestionar_usuarios'.
router.get('/', authMiddleware, authorizePermission('usuarios_ver'), getAllUsers);
router.put('/:id', authMiddleware, authorizePermission('usuarios_editar'), updateUser);
router.post('/invite', authMiddleware, authorizePermission('usuarios_invitar'), inviteUser);

module.exports = router;