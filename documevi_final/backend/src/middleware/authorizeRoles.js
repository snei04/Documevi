const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // El middleware de autenticación ya debe haber puesto req.user
    if (!req.user || !req.user.rol) {
      return res.status(403).json({ msg: 'Acceso denegado. No se pudo verificar el rol del usuario.' });
    }

    const userRoleId = req.user.rol;

    // Comprobamos si el rol del usuario está en la lista de roles permitidos
    if (allowedRoles.includes(userRoleId)) {
      next(); // El usuario tiene el rol permitido, continuamos
    } else {
      res.status(403).json({ msg: 'No tienes permiso para realizar esta acción.' });
    }
  };
};

module.exports = authorizeRoles;