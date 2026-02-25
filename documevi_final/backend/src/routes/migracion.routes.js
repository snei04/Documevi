const { Router } = require('express');
const { generarPlantillaEjemplo, cargarMasivo } = require('../controllers/migracion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorizePermission = require('../middleware/authorizePermission');
const multer = require('multer');

const router = Router();

// Multer para archivos en memoria (no guardar en disco)
const upload = multer({ storage: multer.memoryStorage() });

// Proteger todas las rutas
router.use(authMiddleware);

// Descargar plantilla de ejemplo según oficina
router.get(
    '/plantilla/:id_oficina',
    authorizePermission('expedientes_crear'),
    generarPlantillaEjemplo
);

// Subir archivo Excel para carga masiva
router.post(
    '/cargar/:id_oficina',
    authorizePermission('expedientes_crear'),
    upload.single('archivo'),
    cargarMasivo
);

module.exports = router;
