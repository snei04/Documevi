const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const pool = require('./src/config/db');
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
const plantillaRoutes = require('./src/routes/plantilla.routes.js');
const eliminacionRoutes = require('./src/routes/eliminacion.routes.js');
const retencionRoutes = require('./src/routes/retencion.routes.js');
const carpetaRoutes = require('./src/routes/carpeta.routes.js');

// Inicialización de Express
const app = express();

// --- Middlewares Esenciales ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://documevi.appsimevi.co',
  'https://documevi.appsimevi.co:9092',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Rutas de la API ---
app.get('/api', (req, res) => {
  res.json({ message: '¡API del Sistema de Gestión Documental IMEVI funcionando!' });
});
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
app.use('/api/plantillas', plantillaRoutes);
app.use('/api/eliminacion', eliminacionRoutes);
app.use('/api/retencion', retencionRoutes);
app.use('/api/carpetas', carpetaRoutes);
app.use('/api/cajas', require('./src/routes/caja.routes'));
app.use('/api/paquetes', require('./src/routes/paquete.routes'));

// --- MIDDLEWARE GLOBAL PARA MANEJO DE ERRORES ---
// Este middleware debe ir DESPUÉS de todas las rutas de la API.
app.use((err, req, res, next) => {
  // Registra el error completo en la consola del servidor (para ti)
  console.error(err.stack);
  // Envía un mensaje genérico y seguro al usuario
  res.status(500).json({ msg: 'Ocurrió un error inesperado en el servidor.' });
});

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);

  // Iniciar Jobs Programados
  const { iniciarJobRetencion } = require('./src/jobs/retencion.job');
  iniciarJobRetencion();
});