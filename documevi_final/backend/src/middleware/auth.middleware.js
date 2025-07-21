// Archivo: backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Obtener el token del encabezado 'x-auth-token'
  const token = req.header('x-auth-token');

  // Verificar si no hay token
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso no válido' });
  }

  // Verificar el token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Añadimos el payload del user a la petición
    next(); // Continúa con la ejecución de la ruta
  } catch (err) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};