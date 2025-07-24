// Archivo: backend/server.js

const express = require('express');
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

// Conexión de las rutas a sus prefijos en la API
app.use('/api/auth', authRoutes); 
app.use('/api/dependencias', dependenciaRoutes);
app.use('/api/oficinas', oficinaRoutes);
app.use('/api/series', serieRoutes);
app.use('/api/subseries', subserieRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/search', searchRoutes);
// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});