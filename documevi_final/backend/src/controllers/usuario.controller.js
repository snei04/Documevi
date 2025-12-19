/**
 * @fileoverview Controlador de usuarios para el sistema Documevi.
 * Gestiona operaciones CRUD de usuarios, invitaciones, perfiles y contraseñas.
 * 
 * @module controllers/usuario
 */

const pool = require('../config/db');
const crypto = require('crypto'); 
const bcrypt = require('bcryptjs');
const sendEmail = require('../services/email.service');


// ============================================
// GESTIÓN DE USUARIOS (ADMIN)
// ============================================

/**
 * Obtiene la lista de todos los usuarios del sistema.
 * Incluye información del rol asociado a cada usuario.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Array} JSON con lista de usuarios (id, nombre_completo, email, documento, activo, rol)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Consulta con JOIN para obtener el nombre del rol de cada usuario
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

/**
 * Invita a un nuevo usuario al sistema enviando un correo con enlace de activación.
 * El usuario se crea inactivo y debe establecer su contraseña para activarse.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del nuevo usuario
 * @param {string} req.body.nombre_completo - Nombre completo del usuario
 * @param {string} req.body.email - Correo electrónico (debe ser único)
 * @param {string} req.body.documento - Documento de identidad (debe ser único)
 * @param {number} req.body.rol_id - ID del rol a asignar
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.inviteUser = async (req, res) => {
    const { nombre_completo, email, documento, rol_id } = req.body;

    try {
        // Verificar que no exista un usuario con el mismo email o documento
        const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: 'El correo o documento ya está registrado.' });
        }
        
        // Generar token aleatorio para el enlace de activación
        const resetToken = crypto.randomBytes(32).toString('hex');
        // El token expira en 1 hora
        const passwordResetExpires = new Date(Date.now() + 3600000);
        
        // Crear usuario inactivo con token de activación
        await pool.query(
            'INSERT INTO usuarios (nombre_completo, email, documento, rol_id, activo, password_reset_token, password_reset_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_completo, email, documento, rol_id, false, resetToken, passwordResetExpires]
        );
        
        // Construir URL de activación
        const inviteURL = `${'http://localhost:3000'}/set-password/${resetToken}`;
        const subject = '¡Bienvenido! Has sido invitado a Documevi';

        // ============================================
        // PLANTILLA HTML DEL CORREO DE INVITACIÓN
        // ============================================
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

        // Reemplazar placeholders con valores reales
        const finalHtml = htmlBody
            .replace('{{nombre_usuario}}', nombre_completo)
            .replace(new RegExp('{{inviteURL}}', 'g'), inviteURL);

        // Enviar correo de invitación
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

/**
 * Actualiza los datos de un usuario (rol y/o estado activo).
 * Solo para uso administrativo.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del usuario a actualizar
 * @param {Object} req.body - Campos a actualizar
 * @param {number} [req.body.rol_id] - Nuevo rol del usuario
 * @param {boolean} [req.body.activo] - Estado activo/inactivo del usuario
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { rol_id, activo } = req.body;

  try {
    // Construir consulta dinámica según los campos proporcionados
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
    
    // Validar que se proporcionó al menos un campo
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ msg: 'No se proporcionaron campos para actualizar.' });
    }

    // Añadir ID del usuario al final para la cláusula WHERE
    params.push(id);

    const [result] = await pool.query(
      `UPDATE usuarios SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      params
    );

    // Verificar que el usuario existe
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }
    
    res.json({ msg: 'Usuario actualizado con éxito.' });
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};


// ============================================
// PERFIL DE USUARIO (USUARIO AUTENTICADO)
// ============================================

/**
 * Obtiene el perfil del usuario actualmente autenticado, incluyendo sus permisos.
 * Los permisos se obtienen a través del rol asignado al usuario.
 * 
 * @async
 * @param {Object} req - Request de Express (con req.user del middleware de auth)
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con datos del usuario y array de permisos
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
        
        // Extraer solo los nombres de los permisos en un array de strings
        const permisos = permisosRows.map(p => p.nombre_permiso);

        // Devolver los datos del usuario y su lista de permisos
        res.json({
            id: req.user.id,
            nombre_completo: req.user.nombre_completo,
            nombre: req.user.nombre_completo, // Alias para compatibilidad con frontend
            email: req.user.email,
            documento: req.user.documento,
            rol_id: req.user.rol_id,
            permissions: permisos // El frontend espera esta clave
        });

    } catch (error) {
        console.error("Error en getPerfilUsuario:", error);
        res.status(500).json({ msg: 'Error en el servidor al obtener el perfil.' });
    }
};

/**
 * Permite a un usuario autenticado actualizar sus propios datos.
 * 
 * RESTRICCIÓN DE SEGURIDAD: Solo puede cambiar el nombre_completo.
 * Email y documento NO son editables por el usuario (solo administradores).
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos a actualizar
 * @param {string} req.body.nombre_completo - Nuevo nombre completo
 * @param {Object} req.user - Usuario autenticado (del middleware)
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.updatePerfil = async (req, res) => {
    const { nombre_completo } = req.body;
    const id_usuario = req.user.id;

    // Validar que el nombre no esté vacío
    if (!nombre_completo || nombre_completo.trim() === '') {
        return res.status(400).json({ msg: 'El nombre completo es obligatorio.' });
    }

    try {
        // Actualizar solo el nombre (email y documento son inmutables para el usuario)
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


// ============================================
// CAMBIO DE CONTRASEÑA (USUARIO AUTENTICADO)
// ============================================

/**
 * Permite a un usuario autenticado cambiar su propia contraseña.
 * Requiere la contraseña actual para verificar identidad.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos de contraseñas
 * @param {string} req.body.currentPassword - Contraseña actual (para verificación)
 * @param {string} req.body.newPassword - Nueva contraseña (mínimo 6 caracteres)
 * @param {Object} req.user - Usuario autenticado (del middleware)
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const id_usuario = req.user.id;

    // Validar que se proporcionaron ambas contraseñas
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'La contraseña actual y la nueva contraseña son obligatorias.' });
    }

    // Validar longitud mínima de la nueva contraseña
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

        // 2. Verificar que la contraseña actual sea correcta
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hashear la nueva contraseña con bcrypt
        const salt = await bcrypt.genSalt(10);
        const newPasswordHashed = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar la contraseña en la base de datos
        await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [newPasswordHashed, id_usuario]);

        res.json({ msg: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};