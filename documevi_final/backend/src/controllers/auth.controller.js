/**
 * @fileoverview Controlador de autenticación para el sistema Documevi.
 * Gestiona registro, login, logout, recuperación de contraseña y configuración inicial.
 * 
 * @module controllers/auth
 */

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');
const sendEmail = require('../services/email.service');


// ============================================
// REGISTRO DE USUARIOS
// ============================================

/**
 * Registra un nuevo usuario en la base de datos.
 * Esta es una acción administrativa que requiere permisos especiales.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del nuevo usuario
 * @param {string} req.body.nombre_completo - Nombre completo del usuario
 * @param {string} req.body.email - Correo electrónico único
 * @param {string} req.body.documento - Documento de identidad único
 * @param {string} req.body.password - Contraseña en texto plano (se hasheará)
 * @param {number} req.body.rol_id - ID del rol a asignar
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.registerUser = async (req, res) => {
    // Validar campos del formulario usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_completo, email, documento, password, rol_id } = req.body;

    try {
        // Verificar que no exista un usuario con el mismo email o documento
        const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: 'El correo electrónico o el documento ya están registrados.' });
        }

        // Hashear la contraseña con bcrypt (salt de 10 rondas)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar el nuevo usuario con estado activo por defecto
        await pool.query(
            'INSERT INTO usuarios (nombre_completo, email, documento, password, rol_id, activo) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_completo, email, documento, hashedPassword, rol_id, true]
        );
        
        // Enviar correo de bienvenida al nuevo usuario
        await sendEmail({
            to: email,
            subject: '¡Bienvenido a Documevi!',
            text: `Hola ${nombre_completo}, tu cuenta ha sido creada exitosamente.`,
            html: `<b>Hola ${nombre_completo},</b><p>Tu cuenta en el Sistema de Gestión Documental IMEVI ha sido creada exitosamente.</p>`
        });

        // Responder con éxito (no se devuelve token, el usuario debe hacer login)
        res.status(201).json({ msg: 'Usuario creado con éxito.' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};


// ============================================
// AUTENTICACIÓN (LOGIN/LOGOUT)
// ============================================

/**
 * Autentica un usuario y establece una cookie HttpOnly segura.
 * También registra el evento de login en la tabla de auditoría.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Credenciales del usuario
 * @param {string} req.body.documento - Documento de identidad
 * @param {string} req.body.password - Contraseña en texto plano
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con token JWT y datos del usuario, o error
 */
exports.loginUser = async (req, res) => {
    // Validar campos del formulario
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { documento, password } = req.body;

    try {
        // Buscar usuario activo por documento
        const [users] = await pool.query('SELECT * FROM usuarios WHERE documento = ? AND activo = true', [documento]);
        if (users.length === 0) {
            return res.status(400).json({ msg: 'Credenciales inválidas o usuario inactivo.' });
        }
        const usuario = users[0];

        // Comparar contraseña ingresada con el hash almacenado
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }

        // Crear payload del JWT (solo ID y rol, los permisos se cargan en cada petición)
        const payload = {
            user: {
                id: usuario.id,
                rol_id: usuario.rol_id
            },
        };

        // Firmar el token JWT con expiración de 8 horas
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // Establecer cookie HttpOnly para mayor seguridad
        res.cookie('token', token, {
            httpOnly: true,                                    // No accesible desde JavaScript
            secure: process.env.NODE_ENV === 'production',     // Solo HTTPS en producción
            sameSite: 'strict',                                // Protección contra CSRF
            maxAge: 8 * 60 * 60 * 1000                         // 8 horas en milisegundos
        });

        // Registrar el login exitoso en la tabla de auditoría
        await pool.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [usuario.id, 'LOGIN_EXITOSO', `El usuario con documento ${usuario.documento} inició sesión.`]
        );

        // Responder con token y datos básicos del usuario
        res.status(200).json({ 
            msg: 'Inicio de sesión exitoso.',
            token: token,
            user: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                documento: usuario.documento,
                rol_id: usuario.rol_id
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

/**
 * Cierra la sesión del usuario limpiando la cookie de autenticación.
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de confirmación
 */
exports.logoutUser = (req, res) => {
    // Eliminar la cookie del token
    res.clearCookie('token');
    res.status(200).json({ msg: 'Cierre de sesión exitoso.' });
};


// ============================================
// USUARIO AUTENTICADO
// ============================================

/**
 * Obtiene los datos del usuario autenticado a partir del token.
 * Requiere que el middleware de autenticación haya validado el token previamente.
 * 
 * @async
 * @param {Object} req - Request de Express (con req.user del middleware)
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con datos del usuario (id, nombre_completo, email)
 */
exports.getAuthenticatedUser = async (req, res) => {
  try {
    // Consultar datos del usuario usando el ID del token decodificado
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


// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

/**
 * Establece una nueva contraseña usando un token de recuperación.
 * Usado cuando el usuario accede desde el enlace del correo de recuperación.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos para establecer contraseña
 * @param {string} req.body.token - Token de recuperación (hasheado)
 * @param {string} req.body.password - Nueva contraseña
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.setPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        // Buscar usuario con token válido y no expirado
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE password_reset_token = ? AND password_reset_expires > NOW()',
            [token]
        );
        if (users.length === 0) {
            return res.status(400).json({ msg: 'El token es inválido o ha expirado.' });
        }
        
        const user = users[0];
        
        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Actualizar contraseña, activar usuario y limpiar tokens de recuperación
        await pool.query(
            'UPDATE usuarios SET password = ?, activo = true, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        res.json({ msg: 'Contraseña establecida con éxito. Ahora puedes iniciar sesión.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

/**
 * Inicia el proceso de recuperación de contraseña.
 * Genera un token único, lo almacena hasheado en la BD y envía un correo con el enlace.
 * Por seguridad, siempre responde con el mismo mensaje sin importar si el email existe.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos de la solicitud
 * @param {string} req.body.email - Correo electrónico del usuario
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje genérico (por seguridad)
 */
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    // Validar que se proporcionó un email
    if (!email) {
        return res.status(400).json({ msg: 'Por favor, ingrese un correo electrónico.' });
    }
    
    try {
        // Buscar usuario por email
        const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            // Respuesta genérica para no revelar si el email existe
            return res.json({ msg: 'Si el correo existe, se ha enviado un enlace.' });
        }

        const user = users[0];
        
        // Generar token aleatorio de 20 bytes en formato hexadecimal
        const resetToken = crypto.randomBytes(20).toString('hex');
        // Hashear el token para almacenarlo de forma segura en la BD
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // El token expira en 10 minutos
        const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Guardar token hasheado y fecha de expiración en la BD
        await pool.query(
            'UPDATE usuarios SET password_reset_token = ?, password_reset_expires = ? WHERE email = ?',
            [passwordResetToken, passwordResetExpires, email]
        );

        // Construir URL de recuperación (el token sin hashear va en la URL)
        const baseUrl = 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
        
        // Versión en texto plano del correo (para clientes que no soportan HTML)
        const textMessage = `Hola ${user.nombre_completo},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace (válido por 10 minutos):\n\n${resetUrl}\n\nSi no solicitaste este cambio, puedes ignorar este correo.`;

        // Versión HTML del correo con estilos y botón
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
        
        // Enviar correo con ambas versiones (text y html)
        await sendEmail({
            to: email,
            subject: 'Restablecimiento de Contraseña - Documevi',
            text: textMessage,
            html: htmlMessage, 
        });

        // Respuesta genérica por seguridad
        res.json({ msg: 'Si el correo existe en nuestro sistema, se ha enviado un enlace de recuperación.' });
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Resetea la contraseña del usuario utilizando el token enviado por correo.
 * El token viene en la URL y se hashea para compararlo con el almacenado en la BD.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.token - Token de recuperación (sin hashear)
 * @param {Object} req.body - Datos del formulario
 * @param {string} req.body.password - Nueva contraseña
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito o error
 */
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Hashear el token recibido para compararlo con el almacenado en la BD
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    try {
        // Buscar usuario con token válido y no expirado
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

        // Actualizar la contraseña y limpiar los campos de recuperación
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


// ============================================
// CONFIGURACIÓN INICIAL DEL SISTEMA
// ============================================

/**
 * Crea el primer usuario administrador del sistema.
 * Solo funciona si no existen usuarios en la base de datos.
 * Útil para la configuración inicial del sistema.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del administrador
 * @param {string} req.body.nombre_completo - Nombre completo
 * @param {string} req.body.email - Correo electrónico
 * @param {string} req.body.documento - Documento de identidad
 * @param {string} req.body.password - Contraseña
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito y user_id, o error
 */
exports.setupAdmin = async (req, res) => {
    // Validar campos del formulario
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_completo, email, documento, password } = req.body;

    try {
        // Verificar que no existan usuarios en el sistema (primera configuración)
        const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM usuarios');
        if (existingUsers[0].count > 0) {
            return res.status(400).json({ msg: 'El sistema ya tiene usuarios configurados. Use el endpoint de registro normal.' });
        }

        // Verificar que no exista duplicado de email o documento
        const [duplicateUser] = await pool.query('SELECT id FROM usuarios WHERE email = ? OR documento = ?', [email, documento]);
        if (duplicateUser.length > 0) {
            return res.status(400).json({ msg: 'El correo electrónico o el documento ya están registrados.' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear el usuario administrador con rol_id = 1 (Administrador)
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre_completo, email, documento, password, rol_id, activo) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_completo, email, documento, hashedPassword, 1, true]
        );

        console.log(`✅ Usuario administrador creado con ID: ${result.insertId}`);

        res.status(201).json({ 
            msg: 'Usuario administrador creado con éxito. Ahora puede usar el endpoint de login.',
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Error en setupAdmin:", error.message);
        res.status(500).json({ msg: 'Error en el servidor: ' + error.message });
    }
};
