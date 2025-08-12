// Archivo: backend/src/middleware/authorizePermission.js

const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    // El middleware de autenticación ya debe haber puesto req.user
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ msg: 'Acceso denegado. Permisos insuficientes.' });
    }

    const userPermissions = req.user.permissions;

    // Comprobamos si la lista de permisos del usuario incluye el permiso requerido
    if (userPermissions.includes(requiredPermission)) {
      next(); // El usuario tiene el permiso, continuamos
    } else {
      res.status(403).json({ msg: 'No tienes permiso para realizar esta acción.' });
    }
  };
};

module.exports = authorizePermission;