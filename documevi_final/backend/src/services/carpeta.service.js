const pool = require('../config/db');
const CustomError = require('../utils/CustomError');

/**
 * Crea una nueva carpeta.
 * @param {Object} data - Datos de la carpeta (id_oficina, descripcion, capacidad_maxima, id_caja, paquete, etc.)
 * @param {Object} connection - Conexión a la base de datos (opcional, para transacciones externas)
 * @returns {Object} - Datos de la carpeta creada
 */
exports.crearCarpeta = async (data, connection = null) => {
    const conn = connection || pool;
    const {
        id_oficina, descripcion, capacidad_maxima,
        id_caja, // Referencia a la caja
        id_expediente, // Referencia al expediente (nuevo)
        paquete, tomo, modulo, entrepaño, estante, otro // Legacy / Override
    } = data;
    const año = new Date().getFullYear();

    if (!id_oficina) {
        throw new CustomError('El ID de la oficina es obligatorio.', 400);
    }

    // Si no se pasó una conexión externa, iniciar una transacción local
    // Si se pasó, asumimos que la transacción se maneja fuera
    const isLocalTransaction = !connection;
    if (isLocalTransaction) {
        /*
          NOTA: Si usamos pool.query directamente no hay startTransaction.
          Para transacciones locales necesitamos getConnection.
          Pero si 'conn' es pool, no podemos hacer conn.beginTransaction().
          Normalmente withTransaction maneja esto.
          Para simplificar, si no hay conexión externa, obtenemos una.
        */
        // Sin embargo, para mantener coherencia con el patrón de servicio:
        // Si no hay conexión, usamos 'pool' para queries simples, o implementamos transacción aquí.
        // Dado que crearCarpeta requiere consistencia (consecutivo, update caja), DEBE ser transaccional.
    }

    // Función helper para ejecutar query usando la conexión adecuada
    const query = async (sql, params) => {
        return conn.query(sql, params);
    };

    // Lógica principal envuelta para ser usada dentro o fuera de transacción
    const executeLogic = async (transactionConn) => {
        // 1. Validar Caja si se proporciona
        let ubicacion_final = {
            paquete, modulo, entrepaño, estante
        };

        if (id_caja) {
            // Locking read if transaction
            const [cajaRows] = await transactionConn.query('SELECT * FROM cajas WHERE id = ? FOR UPDATE', [id_caja]);
            if (cajaRows.length === 0) {
                throw new CustomError('La caja seleccionada no existe.', 400);
            }
            const caja = cajaRows[0];

            if (caja.estado !== 'Abierta') {
                throw new CustomError('La caja seleccionada está cerrada o inactiva.', 400);
            }

            if (caja.cantidad_actual >= caja.capacidad_carpetas) {
                throw new CustomError(`La caja ha alcanzado su capacidad máxima (${caja.capacidad_carpetas}).`, 400);
            }

            // Heredar ubicación
            ubicacion_final.paquete = caja.codigo_caja;
            ubicacion_final.modulo = caja.ubicacion_modulo;
            ubicacion_final.entrepaño = caja.ubicacion_entrepaño;
            ubicacion_final.estante = caja.ubicacion_estante;

            // Incrementar contador
            await transactionConn.query('UPDATE cajas SET cantidad_actual = cantidad_actual + 1 WHERE id = ?', [id_caja]);
        }

        // 2. Obtener consecutivo global (numérico simple: 1, 2, 3...)
        const [rows] = await transactionConn.query(
            'SELECT MAX(consecutivo) as max_consecutivo FROM carpetas FOR UPDATE'
        );

        const nextConsecutivo = (rows[0].max_consecutivo || 0) + 1;
        const codigo_carpeta = String(nextConsecutivo);

        // 3. Crear carpeta
        const [result] = await transactionConn.query(
            `INSERT INTO carpetas (
                id_oficina, año, consecutivo, codigo_carpeta, descripcion, capacidad_maxima,
                id_caja, id_expediente,
                paquete, tomo, modulo, entrepaño, estante, otro
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_oficina, año, nextConsecutivo, codigo_carpeta, descripcion || '', capacidad_maxima || 200,
                id_caja || null, id_expediente || null,
                ubicacion_final.paquete || null, tomo || null,
                ubicacion_final.modulo || null, ubicacion_final.entrepaño || null,
                ubicacion_final.estante || null, otro || null
            ]
        );

        return {
            msg: 'Carpeta creada con éxito.',
            id: result.insertId,
            codigo_carpeta,
            consecutivo: nextConsecutivo,
            año,
            capacidad_maxima: capacidad_maxima || 200,
            id_caja: id_caja || null,
            ...ubicacion_final
        };
    };

    if (isLocalTransaction) {
        const transactionConn = await pool.getConnection();
        try {
            await transactionConn.beginTransaction();
            const result = await executeLogic(transactionConn);
            await transactionConn.commit();
            return result;
        } catch (error) {
            await transactionConn.rollback();
            throw error;
        } finally {
            transactionConn.release();
        }
    } else {
        // Usar la conexión externa (ya es transaccional)
        return executeLogic(conn);
    }
};
