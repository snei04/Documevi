// Archivo: backend/src/controllers/prestamo.controller.js
const pool = require('../config/db');
const { sendEmail } = require('../services/email.service');

// Crear una nueva solicitud de préstamo
exports.createPrestamo = async (req, res) => {
  const { id_expediente, fecha_devolucion_prevista, observaciones } = req.body;
  const id_usuario_solicitante = req.user.id; // Obtenido del token

  if (!id_expediente || !fecha_devolucion_prevista) {
    return res.status(400).json({ msg: 'El expediente y la fecha de devolución son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO prestamos (id_expediente, id_usuario_solicitante, fecha_devolucion_prevista, observaciones) VALUES (?, ?, ?, ?)',
      [id_expediente, id_usuario_solicitante, fecha_devolucion_prevista, observaciones]
    );

     const [admins] = await pool.query("SELECT email FROM usuarios WHERE rol_id = 1 AND activo = true");
    const [solicitantes] = await pool.query("SELECT nombre_completo FROM usuarios WHERE id = ?", [id_usuario_solicitante]);
    const solicitante = solicitantes[0];
    const [expedientes] = await pool.query("SELECT nombre_expediente FROM expedientes WHERE id = ?", [id_expediente]);
    const expediente = expedientes[0];
    // 3. Si hay administradores, les enviamos el correo
    if (admins.length > 0 && solicitante && expediente) {
      const subject = `Nueva Solicitud de Préstamo - ${expediente.nombre_expediente}`;
      const text = `El usuario ${solicitante.nombre_completo} ha solicitado un préstamo del expediente "${expediente.nombre_expediente}".\nPor favor, ingrese a la plataforma para aprobar o rechazar la solicitud.`;
      const html = `<p>El usuario <b>${solicitante.nombre_completo}</b> ha solicitado un préstamo del expediente <b>"${expediente.nombre_expediente}"</b>.</p><p>Por favor, ingrese a la plataforma para aprobar o rechazar la solicitud.</p>`;
      
      for (const admin of admins) {
        await sendEmail(admin.email, subject, text, html);
      }
    }
      
      
    
    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    console.error("Error al crear la solicitud de préstamo:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Obtener todos los préstamos (para administradores)
exports.getAllPrestamos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT p.*, e.nombre_expediente, u.nombre_completo as nombre_solicitante
        FROM prestamos p
        JOIN expedientes e ON p.id_expediente = e.id
        JOIN usuarios u ON p.id_usuario_solicitante = u.id
        ORDER BY p.fecha_solicitud DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Actualizar el estado de un préstamo (aprobar, devolver, etc.)
exports.updatePrestamoStatus = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Lista de estados válidos
    const estadosValidos = ['Prestado', 'Devuelto', 'Vencido'];
    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ msg: 'El estado proporcionado no es válido.' });
    }

    try {
        let query = 'UPDATE prestamos SET estado = ?';
        const params = [estado, id];

        // Si se está devolviendo, actualizamos la fecha de devolución real
        if (estado === 'Devuelto') {
            query += ', fecha_devolucion_real = CURDATE()';
        }

        query += ' WHERE id = ?';

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Préstamo no encontrado.' });
        }

        res.json({ msg: 'Estado del préstamo actualizado con éxito.' });
    } catch (error) {
        console.error("Error al actualizar el préstamo:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};