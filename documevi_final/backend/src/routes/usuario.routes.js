const { Router } = require('express');
const { 
    getAllUsers, 
    updateUser, 
    inviteUser 
} = require('../controllers/usuario.controller'); 
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');

const router = Router();

// Todas estas rutas son solo para administradores (rol_id = 1)
router.use(authMiddleware, authorizePermission('gestionar_usuarios'));

// 2. Definimos las rutas para cada acción
router.get('/', getAllUsers); // Obtener todos los usuarios
router.put('/:id', updateUser); // Actualizar un usuario existente (rol/estado)
router.post('/invite', inviteUser); // Invitar a un usuario nuevo

module.exports = router;