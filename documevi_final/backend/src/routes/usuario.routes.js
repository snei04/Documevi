// En: routes/usuario.routes.js

const { Router } = require('express');
const { 
    getAllUsers, 
    updateUser, 
    inviteUser,
    getPerfilUsuario // 1. Importamos la nueva función del controlador
} = require('../controllers/usuario.controller'); 
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// --- RUTAS QUE SOLO REQUIEREN AUTENTICACIÓN ---
// Cualquier usuario logueado puede consultar su propio perfil.
router.get('/perfil', authMiddleware, getPerfilUsuario);


// --- RUTAS QUE REQUIEREN PERMISOS DE ADMINISTRADOR ---
// Para las siguientes rutas, el usuario no solo debe estar autenticado, 
// sino que también debe tener el permiso 'gestionar_usuarios'.
router.get('/', authMiddleware, authorizePermission('gestionar_usuarios'), getAllUsers);
router.put('/:id', authMiddleware, authorizePermission('gestionar_usuarios'), updateUser);
router.post('/invite', authMiddleware, authorizePermission('gestionar_usuarios'), inviteUser);

module.exports = router;