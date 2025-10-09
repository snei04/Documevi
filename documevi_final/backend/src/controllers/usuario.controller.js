const pool = require('../config/db');
const crypto = require('crypto'); 
const sendEmail = require('../services/email.service');

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.nombre_completo, u.email, u.documento, u.activo, r.nombre as rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.nombre_completo ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Invitar a un nuevo usuario
exports.inviteUser = async (req, res) => {
    const { nombre_completo, email, documento, rol_id } = req.body;

    try {
        // Verificamos si el correo o documento ya están registrados
        const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: 'El correo o documento ya está registrado.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 3600000);
        await pool.query(
            'INSERT INTO usuarios (nombre_completo, email, documento, rol_id, activo, password_reset_token, password_reset_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_completo, email, documento, rol_id, false, resetToken, passwordResetExpires]
        );
        
        const inviteURL = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
        const subject = 'Invitación para unirte a Documevi';
        const htmlBody = `...`; // Tu plantilla HTML aquí
        const finalHtml = htmlBody
            .replace('{{nombre_usuario}}', nombre_completo)
            .replace(new RegExp('{{inviteURL}}', 'g'), inviteURL);

        
        await sendEmail({
            to: email,
            subject: subject,
            text: `Has sido invitado a Documevi. Crea tu contraseña aquí: ${inviteURL}`,
            html: finalHtml
        });

        res.status(201).json({ msg: 'Invitación enviada con éxito.' });

    } catch (error) {
        console.error("Error al invitar usuario:", error);
        res.status(500).json({ msg: error.message || 'Error en el servidor' });
    }
};

// Actualizar un usuario (rol o estado)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { rol_id, activo } = req.body;

  try {
    // Construimos la consulta dinámicamente por si solo se envía un campo
    let fieldsToUpdate = [];
    let params = [];
    if (rol_id) {
      fieldsToUpdate.push('rol_id = ?');
      params.push(rol_id);
    }
    if (activo !== undefined) {
      fieldsToUpdate.push('activo = ?');
      params.push(activo);
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ msg: 'No se proporcionaron campos para actualizar.' });
    }

    params.push(id); // Añadimos el ID del usuario al final para el WHERE

    const [result] = await pool.query(
      `UPDATE usuarios SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    res.json({ msg: 'Usuario actualizado con éxito.' });
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

/**
 * Obtiene el perfil del usuario actualmente autenticado, incluyendo sus permisos.
 */
exports.getPerfilUsuario = async (req, res) => {
    // El middleware de autenticación ya ha puesto los datos del usuario en req.user
    const id_usuario = req.user.id;

    try {
        // Consulta para obtener los permisos del usuario a través de su rol
        const [permisosRows] = await pool.query(`
            SELECT p.nombre_permiso 
            FROM permisos p
            JOIN rol_permisos rp ON p.id = rp.id_permiso
            JOIN usuarios u ON rp.id_rol = u.rol_id
            WHERE u.id = ?
        `, [id_usuario]);
        
        // Extraemos solo los nombres de los permisos en un array de strings
        const permisos = permisosRows.map(p => p.nombre_permiso);

        // Devolvemos los datos del usuario y su lista de permisos
        res.json({
            id: req.user.id,
            nombre: req.user.nombre_completo,
            email: req.user.email,
            rol_id: req.user.rol_id, // Es bueno enviar el ID del rol también
            permissions: permisos // El frontend espera esta clave
        });

    } catch (error) {
        console.error("Error en getPerfilUsuario:", error);
        res.status(500).json({ msg: 'Error en el servidor al obtener el perfil.' });
    }
};