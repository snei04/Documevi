// Archivo: backend/server.js

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno del archivo .env
dotenv.config();

// --- Importación de Rutas ---
const authRoutes = require('./src/routes/auth.routes');
const dependenciaRoutes = require('./src/routes/dependencia.routes');
const oficinaRoutes = require('./src/routes/oficina.routes');
const serieRoutes = require('./src/routes/serie.routes.js');
const subserieRoutes = require('./src/routes/subserie.routes.js');
const documentoRoutes = require('./src/routes/documento.routes.js');
const expedienteRoutes = require('./src/routes/expediente.routes.js');
const searchRoutes = require('./src/routes/search.routes.js');
const workflowRoutes = require('./src/routes/workflow.routes.js');
const rolRoutes = require('./src/routes/rol.routes.js');
const prestamoRoutes = require('./src/routes/prestamo.routes.js');
const usuarioRoutes = require('./src/routes/usuario.routes.js');
const statsRoutes = require('./src/routes/stats.routes.js');
const reporteRoutes = require('./src/routes/reporte.routes.js');
const auditoriaRoutes = require('./src/routes/auditoria.routes.js');
const transferenciaRoutes = require('./src/routes/transferencia.routes.js');
const permisoRoutes = require('./src/routes/permiso.routes.js');
const campoRoutes = require('./src/routes/campo_personalizado.routes.js');

// Inicialización de Express
const app = express();

// --- Middlewares Esenciales ---
app.use(cors());
app.use(express.json());

// --- Rutas de la API ---
// Ruta de prueba para saber si el servidor funciona
app.get('/api', (req, res) => {
  res.json({ message: '¡API del Sistema de Gestión Documental IMEVI funcionando!' });
});
// Ruta para servir archivos estáticos (como imágenes, documentos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión de las rutas a sus prefijos en la API
app.use('/api/auth', authRoutes); 
app.use('/api/dependencias', dependenciaRoutes);
app.use('/api/oficinas', oficinaRoutes);
app.use('/api/series', serieRoutes);
app.use('/api/subseries', subserieRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/transferencias', transferenciaRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/campos-personalizados', campoRoutes);
// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});