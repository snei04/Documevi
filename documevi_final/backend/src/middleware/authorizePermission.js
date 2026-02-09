const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    // El middleware de autenticación ya debe haber puesto req.user
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ msg: 'Acceso denegado. Permisos insuficientes.' });
    }

    const userPermissions = req.user.permissions;

    // Si es un array, verificar si tiene AL MENOS UNO de los permisos (OR)
    if (Array.isArray(requiredPermission)) {
      const hasPermission = requiredPermission.some(p => userPermissions.includes(p));
      if (hasPermission) return next();
    } else {
      // Si es un string simple
      if (userPermissions.includes(requiredPermission)) return next();
    }

    res.status(403).json({ msg: 'No tienes permiso para realizar esta acción.' });
  };
};

module.exports = authorizePermission;