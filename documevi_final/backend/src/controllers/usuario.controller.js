// Archivo: backend/src/controllers/usuario.controller.js
const pool = require('../config/db');
const crypto = require('crypto'); // Módulo nativo de Node.js para generar tokens
const { sendEmail } = require('../services/email.service');

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
    // 1. Verificar que el usuario no exista
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: 'El correo o documento ya está registrado.' });
    }

    // 2. Generar un token único y seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // Token válido por 1 hora

    // 3. Crear el usuario sin contraseña y con el token
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre_completo, email, documento, rol_id, activo, password_reset_token, password_reset_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre_completo, email, documento, rol_id, false, resetToken, passwordResetExpires] // El usuario empieza como inactivo
    );

    // 4. Enviar el correo de invitación
    const inviteURL = `http://localhost:3000/set-password/${resetToken}`;
        const subject = 'Invitación para unirte a Documevi';

        // Creamos el cuerpo del correo en HTML
        const htmlBody = `
            <!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background-color: #0077B6; color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; }
        .content { padding: 30px; line-height: 1.6; color: #333; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { background-color: #0077B6; color: white !important; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { background-color: #f4f7f6; color: #888; padding: 20px; text-align: center; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a Documevi!</h1>
        </div>
        <div class="content">
            <p>Hola, <strong>{{nombre_usuario}}</strong>,</p>
            <p>Has sido invitado a unirte al Sistema de Gestión Documental. Para completar tu registro y crear tu contraseña, por favor haz clic en el siguiente botón:</p>
            <div class="button-container">
                <a href="{{inviteURL}}" class="button">Crear mi Contraseña</a>
            </div>
            <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
            <p><a href="{{inviteURL}}">{{inviteURL}}</a></p>
            <p>Si no esperabas esta invitación, por favor ignora este correo.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 IMEVI SAS. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Reemplazamos los marcadores de posición con los datos reales
        const finalHtml = htmlBody
            .replace('{{nombre_usuario}}', nombre_completo)
            .replace(new RegExp('{{inviteURL}}', 'g'), inviteURL);

        // Enviamos el correo con el parámetro 'html'
        await sendEmail(email, subject, "Has sido invitado a Documevi.", finalHtml);

    res.status(201).json({ msg: 'Invitación enviada con éxito.' });

  } catch (error) {
    console.error("Error al invitar usuario:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
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