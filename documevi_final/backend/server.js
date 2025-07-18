// Archivo: backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno del archivo .env
dotenv.config();

// Importar las rutas que hemos creado
const authRoutes = require('./src/routes/auth.routes');

// Inicialización de Express
const app = express();

// --- Middlewares Esenciales ---
// Permite que tu frontend (en otro puerto) se comunique con este backend
app.use(cors());
// Permite que el servidor entienda y procese datos en formato JSON
app.use(express.json());

// --- Rutas de la API ---
// Ruta de prueba para saber si el servidor funciona
app.get('/api', (req, res) => {
  res.json({ message: '¡API del Sistema de Gestión Documental IMEVI funcionando!' });
});

// Todas las rutas de autenticación usarán el prefijo /api/auth
app.use('/api/auth', authRoutes); 

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});