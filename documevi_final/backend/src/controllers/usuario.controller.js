const pool = require('../config/db');
const crypto = require('crypto'); 
const bcrypt = require('bcryptjs');
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
        // La lógica de creación de usuario se mantiene igual
        const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: 'El correo o documento ya está registrado.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora
        await pool.query(
            'INSERT INTO usuarios (nombre_completo, email, documento, rol_id, activo, password_reset_token, password_reset_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_completo, email, documento, rol_id, false, resetToken, passwordResetExpires]
        );
        
        const inviteURL = `${'http://localhost:3000'}/set-password/${resetToken}`;
        const subject = '¡Bienvenido! Has sido invitado a Documevi';

        // --- INICIO DE LA PLANTILLA HTML MEJORADA ---
        const htmlBody = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-g">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7f6;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center" style="background-color: #0077B6; padding: 40px 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Bienvenido a Documevi!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hola, <strong>{{nombre_usuario}}</strong>,</p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6;">Has sido invitado a unirte a nuestro Sistema de Gestión Documental. Para activar tu cuenta y crear tu contraseña personal, por favor haz clic en el siguiente botón:</p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{{inviteURL}}" style="background-color: #0077B6; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Crear mi Contraseña</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #555555; font-size: 14px; line-height: 1.6;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
                            <p style="font-size: 12px; color: #0077B6; word-break: break-all;"><a href="{{inviteURL}}" style="color: #0077B6;">{{inviteURL}}</a></p>
                            <p style="color: #555555; font-size: 14px; line-height: 1.6;">Si no esperabas esta invitación, puedes ignorar este correo de forma segura.</p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f4f7f6" style="padding: 20px 30px; text-align: center;">
                            <p style="color: #888888; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} IMEVI SAS. Todos los derechos reservados.</p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
        // --- FIN DE LA PLANTILLA HTML ---

        // El resto de la lógica se mantiene igual
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
            nombre_completo: req.user.nombre_completo,
            nombre: req.user.nombre_completo, // Para compatibilidad
            email: req.user.email,
            documento: req.user.documento,
            rol_id: req.user.rol_id, // Es bueno enviar el ID del rol también
            permissions: permisos // El frontend espera esta clave
        });

    } catch (error) {
        console.error("Error en getPerfilUsuario:", error);
        res.status(500).json({ msg: 'Error en el servidor al obtener el perfil.' });
    }
};

/**
 * Permite a un usuario autenticado actualizar sus propios datos.
 * RESTRICCIÓN: Solo puede cambiar el nombre_completo
 * Email y documento NO son editables por seguridad
 */
exports.updatePerfil = async (req, res) => {
    const { nombre_completo } = req.body;
    const id_usuario = req.user.id;

    if (!nombre_completo || nombre_completo.trim() === '') {
        return res.status(400).json({ msg: 'El nombre completo es obligatorio.' });
    }

    try {
        await pool.query(
            'UPDATE usuarios SET nombre_completo = ? WHERE id = ?',
            [nombre_completo.trim(), id_usuario]
        );
        res.json({ msg: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Permite a un usuario autenticado cambiar su propia contraseña.
 */
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const id_usuario = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'La contraseña actual y la nueva contraseña son obligatorias.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        // 1. Obtener el hash de la contraseña actual del usuario desde la BD
        const [users] = await pool.query('SELECT password FROM usuarios WHERE id = ?', [id_usuario]);
        if (users.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        const user = users[0];

        // 2. Comparar la contraseña actual enviada con la de la BD
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const newPasswordHashed = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar la contraseña en la BD
        await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [newPasswordHashed, id_usuario]);

        res.json({ msg: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};