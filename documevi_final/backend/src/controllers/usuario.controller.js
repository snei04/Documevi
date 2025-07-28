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
    const text = `Hola ${nombre_completo},\n\nHas sido invitado a unirte a Documevi. Por favor, haz clic en el siguiente enlace o pégalo en tu navegador para crear tu contraseña:\n\n${inviteURL}\n\nSi no esperabas esta invitación, por favor ignora este correo.\n`;
    
    await sendEmail(email, subject, text);

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