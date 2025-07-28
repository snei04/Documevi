const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendEmail } = require('../services/email.service');


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
    
    const payload = {
      user: {
        id: usuario.id,
        rol: usuario.rol_id
      },
    };

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

