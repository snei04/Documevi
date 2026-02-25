const pool = require('../config/db');
const { withTransaction } = require('../utils/transaction.util');
const CustomError = require('../utils/CustomError');

/**
 * Obtener el paquete activo GLOBAL. Si no existe, crea uno nuevo.
 */
exports.obtenerPaqueteActivo = async () => {
    // Buscar cualquier paquete activo (ya no depende de oficina)
    const [rows] = await pool.query(
        'SELECT * FROM paquetes WHERE estado = ? LIMIT 1',
        ['Activo']
    );

    if (rows.length > 0) {
        return rows[0];
    }

    // No hay paquete activo → crear uno nuevo
    return await exports.crearPaquete();
};

/**
 * Crea un nuevo paquete GLOBAL con numeración secuencial simple (1, 2, 3...).
 */
exports.crearPaquete = async (connection = null) => {
    const conn = connection || pool;

    // Obtener el último número global de paquete
    const [lastPaq] = await conn.query(
        `SELECT numero_paquete FROM paquetes ORDER BY CAST(numero_paquete AS UNSIGNED) DESC LIMIT 1`
    );

    let nextNum = 1;
    if (lastPaq.length > 0) {
        nextNum = parseInt(lastPaq[0].numero_paquete, 10) + 1;
        if (isNaN(nextNum)) nextNum = 1;
    }

    const numero_paquete = String(nextNum);

    // Insertar paquete sin oficina (NULL)
    const [result] = await conn.query(
        `INSERT INTO paquetes (numero_paquete, id_oficina, estado) VALUES (?, NULL, 'Activo')`,
        [numero_paquete]
    );

    return {
        id: result.insertId,
        numero_paquete,
        id_oficina: null,
        estado: 'Activo',
        expedientes_actuales: 0,
        fecha_creacion: new Date()
    };
};

/**
 * Asigna un expediente a un paquete y opcionalmente marca el paquete como lleno.
 */
exports.asignarExpediente = async (id_expediente, id_paquete, marcar_lleno = false, observaciones = null) => {
    return withTransaction(pool, async (connection) => {
        // Verificar que el paquete existe y está activo
        const [paqRows] = await connection.query(
            'SELECT * FROM paquetes WHERE id = ? FOR UPDATE',
            [id_paquete]
        );

        if (paqRows.length === 0) {
            throw new CustomError('Paquete no encontrado.', 404);
        }

        const paquete = paqRows[0];

        if (paquete.estado !== 'Activo') {
            throw new CustomError('El paquete no está activo. Use el paquete activo del sistema.', 400);
        }

        // Verificar que el expediente existe y no tiene paquete asignado
        const [expRows] = await connection.query(
            'SELECT id, id_paquete, nombre_expediente FROM expedientes WHERE id = ?',
            [id_expediente]
        );

        if (expRows.length === 0) {
            throw new CustomError('Expediente no encontrado.', 404);
        }

        if (expRows[0].id_paquete) {
            throw new CustomError(`El expediente ya está asignado al paquete ID ${expRows[0].id_paquete}.`, 400);
        }

        // Asignar expediente al paquete
        await connection.query(
            'UPDATE expedientes SET id_paquete = ? WHERE id = ?',
            [id_paquete, id_expediente]
        );

        // Incrementar contador
        await connection.query(
            'UPDATE paquetes SET expedientes_actuales = expedientes_actuales + 1 WHERE id = ?',
            [id_paquete]
        );

        let nuevoPaquete = null;

        // Si el usuario marcó el paquete como lleno
        if (marcar_lleno) {
            await connection.query(
                `UPDATE paquetes SET estado = 'Lleno', fecha_cierre = NOW(), observaciones = ? WHERE id = ?`,
                [observaciones || `Paquete lleno con ${paquete.expedientes_actuales + 1} expedientes`, id_paquete]
            );

            // Crear el siguiente paquete automáticamente
            nuevoPaquete = await exports.crearPaquete(connection);
        }

        // Auditoría
        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [null, 'ASIGNAR_EXPEDIENTE_PAQUETE',
                `Expediente ${id_expediente} asignado al paquete ${paquete.numero_paquete}${marcar_lleno ? ' (paquete marcado lleno)' : ''}`]
        );

        return {
            msg: marcar_lleno
                ? `Expediente asignado. Paquete ${paquete.numero_paquete} marcado como lleno. Nuevo paquete: ${nuevoPaquete.numero_paquete}`
                : `Expediente asignado al paquete ${paquete.numero_paquete}`,
            paquete_actual: marcar_lleno ? { ...paquete, estado: 'Lleno' } : { ...paquete, expedientes_actuales: paquete.expedientes_actuales + 1 },
            nuevo_paquete: nuevoPaquete
        };
    });
};

/**
 * Marca un paquete como lleno y crea el siguiente.
 */
exports.marcarLleno = async (id_paquete, observaciones = null, id_usuario = null) => {
    return withTransaction(pool, async (connection) => {
        const [paqRows] = await connection.query(
            'SELECT * FROM paquetes WHERE id = ? FOR UPDATE',
            [id_paquete]
        );

        if (paqRows.length === 0) {
            throw new CustomError('Paquete no encontrado.', 404);
        }

        const paquete = paqRows[0];

        if (paquete.estado !== 'Activo') {
            throw new CustomError('Solo se pueden cerrar paquetes activos.', 400);
        }

        await connection.query(
            `UPDATE paquetes SET estado = 'Lleno', fecha_cierre = NOW(), observaciones = ? WHERE id = ?`,
            [observaciones || `Paquete lleno con ${paquete.expedientes_actuales} expedientes`, id_paquete]
        );

        const nuevoPaquete = await exports.crearPaquete(connection);

        // Auditoría
        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario, 'CERRAR_PAQUETE',
                `Paquete ${paquete.numero_paquete} marcado como lleno. Nuevo paquete: ${nuevoPaquete.numero_paquete}`]
        );

        return {
            msg: `Paquete ${paquete.numero_paquete} marcado como lleno. Se creó el paquete ${nuevoPaquete.numero_paquete}.`,
            paquete_cerrado: { ...paquete, estado: 'Lleno' },
            nuevo_paquete: nuevoPaquete
        };
    });
};

/**
 * Reabre un paquete cerrado.
 */
exports.reabrirPaquete = async (id_paquete, id_usuario = null) => {
    return withTransaction(pool, async (connection) => {
        const [paqRows] = await connection.query(
            'SELECT * FROM paquetes WHERE id = ?',
            [id_paquete]
        );

        if (paqRows.length === 0) {
            throw new CustomError('Paquete no encontrado.', 404);
        }

        if (paqRows[0].estado === 'Activo') {
            throw new CustomError('El paquete ya está activo.', 400);
        }

        // Verificar que no haya otro paquete activo GLOBAL
        const [activo] = await connection.query(
            'SELECT id, numero_paquete FROM paquetes WHERE estado = ?',
            ['Activo']
        );

        if (activo.length > 0) {
            throw new CustomError(
                `Ya existe un paquete activo en el sistema: ${activo[0].numero_paquete}. Ciérrelo primero.`,
                400
            );
        }

        await connection.query(
            `UPDATE paquetes SET estado = 'Activo', fecha_cierre = NULL WHERE id = ?`,
            [id_paquete]
        );

        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario, 'REABRIR_PAQUETE', `Paquete ${paqRows[0].numero_paquete} reabierto`]
        );

        return { msg: `Paquete ${paqRows[0].numero_paquete} reabierto exitosamente.` };
    });
};

/**
 * Lista los paquetes de una oficina. Soporta búsqueda por número de paquete.
 */
exports.listarPaquetes = async (id_oficina = null, page = 1, limit = 20, search = '') => {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    if (id_oficina) {
        whereConditions.push('p.id_oficina = ?');
        params.push(id_oficina);
    }

    if (search && search.trim() !== '') {
        whereConditions.push('p.numero_paquete LIKE ?');
        params.push(`%${search.trim()}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM paquetes p ${whereClause}`, params
    );

    const [rows] = await pool.query(
        `SELECT p.*, o.nombre_oficina, o.codigo_oficina
         FROM paquetes p
         LEFT JOIN oficinas_productoras o ON p.id_oficina = o.id
         ${whereClause}
         ORDER BY p.fecha_creacion DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        paquetes: rows,
        total: countRows[0].total,
        page,
        totalPages: Math.ceil(countRows[0].total / limit)
    };
};

/**
 * Obtiene los expedientes de un paquete.
 */
exports.obtenerExpedientesPaquete = async (id_paquete) => {
    const [rows] = await pool.query(
        `SELECT e.id, e.nombre_expediente, e.estado, e.fecha_apertura, e.fecha_cierre,
                c.codigo_carpeta
         FROM expedientes e
         LEFT JOIN carpetas c ON c.id_expediente = e.id
         WHERE e.id_paquete = ?
         ORDER BY e.id`,
        [id_paquete]
    );

    return rows;
};
