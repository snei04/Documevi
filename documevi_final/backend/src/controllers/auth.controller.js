// src/controllers/auth.controller.js
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Necesitamos crear este archivo de conexión

/**
 * Registra un nuevo usuario en la base de datos.
 */
exports.registerUser = async (req, res) => {
  // 1. Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // 👇 AÑADIMOS 'documento' AQUÍ 👇
  const { nombre_completo, email, documento, password, rol_id } = req.body;

  try {
    // 2. Verificar si el usuario o el documento ya existen
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: 'El correo electrónico o el documento ya están registrados.' });
    }

    // 3. Hashear la contraseña (sin cambios)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Guardar el nuevo usuario en la DB
    // 👇 ACTUALIZAMOS LA CONSULTA SQL Y LOS PARÁMETROS 👇
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre_completo, email, documento, password, rol_id) VALUES (?, ?, ?, ?, ?)',
      [nombre_completo, email, documento, hashedPassword, rol_id]
    );
    const userId = result.insertId;
    
    // ... (el resto de la función sigue igual)

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error en el servidor');
  }
};

/**
 * Autentica un usuario y devuelve un token.
 */

exports.loginUser = async (req, res) => {
  // 1. Validar los datos de entrada que definimos en auth.routes.js
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

    const { documento, password } = req.body;

  try {
    // 2. Verificar si el usuario existe en la base de datos
   const [users] = await pool.query('SELECT * FROM usuarios WHERE documento = ?', [documento]);
    
    if (users.length === 0) {
      // Por seguridad, no especificamos si falló el email o la contraseña
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const usuario = users[0];

    // 3. Comparar la contraseña enviada con la hasheada en la DB
    // Esta es la pieza de seguridad más importante del login.
    const isMatch = await bcrypt.compare(password, usuario.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    
    // Si llegamos aquí, ¡el usuario y contraseña son correctos!

    // 4. Crear el payload para el JSON Web Token
    const payload = {
      user: {
        id: usuario.id,
        rol: usuario.rol_id // Guardamos el ID del rol para usarlo después
      },
    };

    // 5. Registrar la acción en la tabla de auditoría (Requisito Sprint 1)
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [usuario.id, 'LOGIN_EXITOSO', `El usuario con documento ${usuario.documento} inició sesión.`]
    );

    // 6. Firmar y devolver el token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }, // El token será válido por 8 horas
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