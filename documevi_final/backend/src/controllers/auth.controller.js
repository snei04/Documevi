const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');
const sendEmail = require('../services/email.service');


/**
 * Registra un nuevo usuario en la base de datos.
 */
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre_completo, email, documento, password, rol_id } = req.body;

  try {
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: 'El correo electrónico o el documento ya están registrados.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre_completo, email, documento, password, rol_id) VALUES (?, ?, ?, ?, ?)',
      [nombre_completo, email, documento, hashedPassword, rol_id]
      
    );
    const userId = result.insertId;
    const subject = '¡Bienvenido a Documevi!';
    const text = `Hola ${nombre_completo}, tu cuenta ha sido creada exitosamente.`;
    const html = `<b>Hola ${nombre_completo},</b><p>Tu cuenta en el Sistema de Gestión Documental IMEVI ha sido creada exitosamente.</p>`;
    await sendEmail(email, subject, text, html);

    const payload = {
      user: {
        id: userId,
        rol: rol_id
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Autentica un usuario y devuelve un token.
 */
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { documento, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM usuarios WHERE documento = ?', [documento]);
    if (users.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const usuario = users[0];

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // --- INICIO DEL CAMBIO ---

    // 1. Buscamos los permisos asociados al rol del usuario
    const [permissions] = await pool.query(
      `SELECT p.nombre_permiso 
       FROM rol_permisos rp 
       JOIN permisos p ON rp.id_permiso = p.id 
       WHERE rp.id_rol = ?`,
      [usuario.rol_id]
    );
    // Creamos un array simple con los nombres de los permisos: ['gestionar_usuarios', 'ver_reportes']
    const userPermissions = permissions.map(p => p.nombre_permiso);

    // 2. Creamos el nuevo payload para el token, incluyendo los permisos
    const payload = {
      user: {
        id: usuario.id,
        rol: usuario.rol_id,
        permissions: userPermissions 
      },
    };

    // --- FIN DEL CAMBIO ---

    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [usuario.id, 'LOGIN_EXITOSO', `El usuario con documento ${usuario.documento} inició sesión.`]
    );

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Obtiene datos del usuario autenticado a partir del token.
 */
exports.getAuthenticatedUser = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre_completo, email FROM usuarios WHERE id = ?', [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }

};

exports.setPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // 1. Buscar al usuario con el token que no haya expirado
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ msg: 'El token es inválido o ha expirado.' });
    }

    const user = users[0];

    // 2. Hashear y guardar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Actualizar el usuario: establecer contraseña, activarlo y limpiar el token
    await pool.query(
      'UPDATE usuarios SET password = ?, activo = true, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ msg: 'Contraseña establecida con éxito. Ahora puedes iniciar sesión.' });

  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'Por favor, ingrese un correo electrónico.' });
    }
    try {
        const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.json({ msg: 'Si el correo existe, se ha enviado un enlace.' });
        }

        const user = users[0];
        const resetToken = crypto.randomBytes(20).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        await pool.query(
            'UPDATE usuarios SET password_reset_token = ?, password_reset_expires = ? WHERE email = ?',
            [passwordResetToken, passwordResetExpires, email]
        );

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
        
        // Versión en texto plano (para respaldo)
        const textMessage = `Hola ${user.nombre_completo},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace (válido por 10 minutos):\n\n${resetUrl}\n\nSi no solicitaste este cambio, puedes ignorar este correo.`;

        // Versión en HTML con el botón
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #0056b3;">Recuperación de Contraseña</h2>
                <p>Hola ${user.nombre_completo},</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Para continuar, haz clic en el botón de abajo. El enlace es válido por 10 minutos.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 25px; margin: 20px 0; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                    Restablecer Contraseña
                </a>
                <p style="font-size: 12px; color: #888;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
        `;
        
        // ✅ Asegúrate de pasar AMBAS propiedades: text y html
        await sendEmail({
            to: email,
            subject: 'Restablecimiento de Contraseña - Documevi',
            text: textMessage,
            html: htmlMessage, 
        });

        res.json({ msg: 'Si el correo existe en nuestro sistema, se ha enviado un enlace de recuperación.' });
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};


exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Hashear el token que viene del usuario para compararlo con el de la BD
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    try {
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE password_reset_token = ? AND password_reset_expires > ?',
            [hashedToken, new Date()]
        );

        if (users.length === 0) {
            return res.status(400).json({ msg: 'El token es inválido o ha expirado.' });
        }

        const user = users[0];

        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Actualizar la contraseña y limpiar los campos de reseteo
        await pool.query(
            'UPDATE usuarios SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({ msg: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};
