const pool = require('../config/db');
const { sendEmail } = require('../services/email.service');
const { addBusinessDays } = require('../utils/date.util');

// Crear una nueva solicitud de préstamo
exports.createPrestamo = async (req, res) => {
    const { id_expediente, observaciones, tipo_prestamo } = req.body;
    const id_usuario_solicitante = req.user.id;

    if (!id_expediente) {
        return res.status(400).json({ msg: 'El expediente es obligatorio.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificación 1: Que el expediente esté disponible
        const [expedientes] = await connection.query("SELECT disponibilidad, nombre_expediente FROM expedientes WHERE id = ?", [id_expediente]);
        if (expedientes.length === 0 || expedientes[0].disponibilidad !== 'Disponible') {
            await connection.rollback();
            return res.status(400).json({ msg: 'El expediente no está disponible para préstamo en este momento.' });
        }
        const nombre_expediente = expedientes[0].nombre_expediente;

        // Verificación 2: Que este usuario no tenga ya una solicitud activa para este expediente
        const [existingPrestamos] = await connection.query(
            "SELECT id FROM prestamos WHERE id_expediente = ? AND id_usuario_solicitante = ? AND estado IN ('Solicitado', 'Prestado')",
            [id_expediente, id_usuario_solicitante]
        );
        if (existingPrestamos.length > 0) {
            await connection.rollback();
            return res.status(400).json({ msg: 'Ya tienes una solicitud activa para este expediente.' });
        }

        // Se calcula la fecha de devolución automáticamente (10 días hábiles)
        const fecha_devolucion_prevista = addBusinessDays(new Date(), 10);
        
        // Se crea el registro del préstamo en la base de datos
        const [result] = await connection.query(
            'INSERT INTO prestamos (id_expediente, id_usuario_solicitante, fecha_devolucion_prevista, observaciones, tipo_prestamo) VALUES (?, ?, ?, ?, ?)',
            [id_expediente, id_usuario_solicitante, fecha_devolucion_prevista, observaciones, tipo_prestamo]
        );
        
        await connection.commit();

        // Lógica de notificación (fuera de la transacción para no revertir si falla el email)
        try {
            const [admins] = await pool.query("SELECT email FROM usuarios WHERE rol_id = 1 AND activo = true");
            const [solicitantes] = await pool.query("SELECT nombre_completo FROM usuarios WHERE id = ?", [id_usuario_solicitante]);

            if (admins.length > 0 && solicitantes.length > 0) {
                const nombre_solicitante = solicitantes[0].nombre_completo;
                const subject = `Nueva Solicitud de Préstamo - Expediente: ${nombre_expediente}`;
                const text = `El usuario ${nombre_solicitante} ha solicitado el expediente "${nombre_expediente}". Ingrese a la plataforma para aprobar la solicitud.`;
                
                for (const admin of admins) {
                    await sendEmail(admin.email, subject, text);
                }
            }
        } catch (emailError) {
            console.error("La solicitud se creó, pero falló la notificación por correo:", emailError);
        }
        
        res.status(201).json({ msg: 'Solicitud de préstamo enviada con éxito.' });

    } catch (error) {
        await connection.rollback();
        console.error("Error crítico al crear la solicitud de préstamo:", error);
        res.status(500).json({ msg: 'Error en el servidor al procesar la solicitud.' });
    } finally {
        connection.release();
    }
};

// Aprobar un préstamo (acción del archivista)
exports.approvePrestamo = async (req, res) => {
    const { id } = req.params; // ID del préstamo
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [prestamos] = await connection.query("SELECT id_expediente FROM prestamos WHERE id = ? AND estado = 'Solicitado'", [id]);
        if (prestamos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Solicitud de préstamo no encontrada o ya procesada.' });
        }
        const { id_expediente } = prestamos[0];

        await connection.query("UPDATE prestamos SET estado = 'Prestado' WHERE id = ?", [id]);
        await connection.query("UPDATE expedientes SET disponibilidad = 'Prestado' WHERE id = ?", [id_expediente]);

        await connection.commit();

        // --- REGISTRO DE AUDITORÍA ---
        await pool.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [req.user.id, 'APROBACION_PRESTAMO', `Se aprobó el préstamo con ID: ${id}`]
        );
        // --- FIN: REGISTRO DE AUDITORÍA ---

        res.json({ msg: 'Préstamo aprobado con éxito. El expediente ahora figura como no disponible.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        connection.release();
    }
};

// Registrar la devolución de un expediente (acción del archivista)
exports.returnPrestamo = async (req, res) => {
    const { id } = req.params; // ID del préstamo
    const { folios, estado_conservacion, inconsistencias } = req.body; // Datos del checklist

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Obtenemos los datos del préstamo, incluyendo su tipo
        const [prestamos] = await connection.query("SELECT id_expediente, tipo_prestamo FROM prestamos WHERE id = ? AND estado = 'Prestado'", [id]);
        
        if (prestamos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Préstamo no encontrado o no está en estado "Prestado".' });
        }
        
        const { id_expediente, tipo_prestamo } = prestamos[0];

        // 2. Verificación condicional del checklist
        // Si el préstamo es Físico y faltan datos del checklist, devolvemos un error
        if (tipo_prestamo === 'Físico' && (folios === undefined || !estado_conservacion)) {
            await connection.rollback();
            return res.status(400).json({ msg: 'Para préstamos físicos, los folios y el estado de conservación son obligatorios.' });
        }

        // 3. Actualizamos el préstamo. Si es electrónico, los campos del checklist serán NULL
        await connection.query(
            "UPDATE prestamos SET estado = 'Devuelto', fecha_devolucion_real = NOW(), dev_folios_confirmados = ?, dev_estado_conservacion = ?, dev_inconsistencias = ? WHERE id = ?",
            [folios, estado_conservacion, inconsistencias, id]
        );
        
        // 4. El expediente vuelve a estar disponible
        await connection.query("UPDATE expedientes SET disponibilidad = 'Disponible' WHERE id = ?", [id_expediente]);

        await connection.commit();
        res.json({ msg: 'Devolución registrada con éxito. El expediente está disponible nuevamente.' });
    } catch (error) {
        await connection.rollback();
        console.error("Error al registrar la devolución:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        connection.release();
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

        const [result] = await pool.query(
      'INSERT INTO prestamos (id_expediente, id_usuario_solicitante, fecha_devolucion_prevista, observaciones, tipo_prestamo) VALUES (?, ?, ?, ?, ?)',
      [id_expediente, id_usuario_solicitante, fecha_devolucion_prevista, observaciones, tipo_prestamo]
    );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Préstamo no encontrado.' });
        }

        res.json({ msg: 'Estado del préstamo actualizado con éxito.' });
    } catch (error) {
        console.error("Error al actualizar el préstamo:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Solicitar una prórroga para un préstamo (acción del usuario)
exports.requestProrroga = async (req, res) => {
    const { id } = req.params; // ID del préstamo
    const id_usuario_solicitante = req.user.id;

    try {
        // Verificamos que el préstamo pertenezca al usuario y esté en estado 'Prestado'
        const [prestamos] = await pool.query(
            "SELECT * FROM prestamos WHERE id = ? AND id_usuario_solicitante = ? AND estado = 'Prestado'",
            [id, id_usuario_solicitante]
        );

        if (prestamos.length === 0) {
            return res.status(404).json({ msg: 'Préstamo no encontrado o no apto para prórroga.' });
        }

        // Incrementamos el contador de prórrogas solicitadas
        await pool.query("UPDATE prestamos SET prorrogas_solicitadas = prorrogas_solicitadas + 1 WHERE id = ?", [id]);

        // Aquí podrías enviar un email al administrador notificando la solicitud de prórroga
        
        res.json({ msg: 'Solicitud de prórroga enviada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


// Aprobar una prórroga (acción del administrador)
exports.approveProrroga = async (req, res) => {
    const { id } = req.params; // ID del préstamo

    try {
        const [prestamos] = await pool.query("SELECT fecha_devolucion_prevista FROM prestamos WHERE id = ?", [id]);
        if (prestamos.length === 0) {
            return res.status(404).json({ msg: 'Préstamo no encontrado.' });
        }

        // 5. Calculamos la nueva fecha: 5 días hábiles desde la fecha prevista anterior
        const nuevaFecha = addBusinessDays(new Date(prestamos[0].fecha_devolucion_prevista), 5);

        await pool.query("UPDATE prestamos SET fecha_devolucion_prevista = ? WHERE id = ?", [nuevaFecha, id]);

        res.json({ msg: 'Prórroga aprobada. La fecha de devolución ha sido extendida.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.getMyPrestamos = async (req, res) => {
  const id_usuario_solicitante = req.user.id; // Obtenido del token

  try {
    const [rows] = await pool.query(`
        SELECT p.*, e.nombre_expediente
        FROM prestamos p
        JOIN expedientes e ON p.id_expediente = e.id
        WHERE p.id_usuario_solicitante = ?
        ORDER BY p.fecha_solicitud DESC
    `, [id_usuario_solicitante]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};