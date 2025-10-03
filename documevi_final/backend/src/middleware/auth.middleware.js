const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async function(req, res, next) {
    console.log("\n--- 1. Auth Middleware INICIADO ---");
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log("✔️ Token encontrado en el header 'Authorization'.");
    }

    if (!token) {
        console.log("❌ Error: No se encontró token. Devolviendo 401.");
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.log("❌ ERROR CRÍTICO: La variable JWT_SECRET no está definida en .env");
        }
        
        console.log("🔑 Intentando verificar el token...");
        const decoded = jwt.verify(token, secret);
        console.log("✔️ Token verificado con éxito. Payload decodificado:", decoded);

        const [permisosRows] = await pool.query(
            `SELECT p.nombre_permiso FROM permisos p JOIN rol_permisos rp ON p.id = rp.id_permiso JOIN usuarios u ON rp.id_rol = u.rol_id WHERE u.id = ?`,
            [decoded.user.id]
        );
        const permisos = permisosRows.map(p => p.nombre_permiso);

        req.user = {
            id: decoded.user.id,
            rol_id: decoded.user.rol_id,
            permissions: permisos
        };
        
        console.log("✔️ Permisos cargados y adjuntados a req.user.");
        next();

    } catch (err) {
        console.error("❌ Error en auth middleware al verificar token:", err.message);
        if (err.name === 'TokenExpiredError') {
            console.log("Razón del error: El token ha expirado.");
        } else if (err.name === 'JsonWebTokenError') {
            console.log("Razón del error: El token es inválido o el JWT_SECRET no coincide.");
        }
        res.status(401).json({ msg: 'Token no es válido o ha expirado' });
    }
};