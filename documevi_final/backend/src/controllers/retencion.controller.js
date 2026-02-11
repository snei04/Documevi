const pool = require('../config/db');

/**
 * Obtiene expedientes que han cumplido o están próximos a cumplir su tiempo de retención
 * Soporta filtros por oficina, serie y rango de fechas
 */
exports.getExpedientesVencidos = async (req, res) => {
    try {
        const { oficina_id, serie_id, fecha_inicio, fecha_fin } = req.query;

        let filterConditions = "";
        const params = [];

        if (oficina_id) {
            filterConditions += " AND o.id = ? ";
            params.push(oficina_id);
        }

        if (serie_id) {
            filterConditions += " AND s.id = ? ";
            params.push(serie_id);
        }

        // Filtro por fecha de vencimiento (dependiendo de la fase)
        if (fecha_inicio && fecha_fin) {
            filterConditions += ` AND (
                (e.fase_retencion = 'En Gestión' AND e.fecha_fin_gestion BETWEEN ? AND ?) OR
                (e.fase_retencion = 'En Central' AND e.fecha_fin_central BETWEEN ? AND ?)
            ) `;
            params.push(fecha_inicio, fecha_fin, fecha_inicio, fecha_fin);
        }

        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // Query principal con límite
        const query = `
            SELECT 
                e.id,
                e.nombre_expediente,
                e.fecha_cierre,
                e.fecha_inicio_retencion,
                e.fecha_fin_gestion,
                e.fecha_fin_central,
                e.fase_retencion,
                e.estado as estado_expediente,
                e.disponibilidad,
                s.nombre_serie,
                s.codigo_serie,
                ss.nombre_subserie,
                ss.codigo_subserie,
                COALESCE(ss.retencion_gestion, s.retencion_gestion) as retencion_gestion,
                COALESCE(ss.retencion_central, s.retencion_central) as retencion_central,
                COALESCE(ss.disposicion_final, s.disposicion_final) as disposicion_final,
                o.nombre_oficina,
                u.nombre_completo as responsable,
                
                CASE 
                    WHEN e.fase_retencion = 'Eliminable' THEN 'Vencido - Eliminable'
                    WHEN e.fase_retencion = 'Histórico' THEN 'Vencido - Histórico'
                    WHEN e.fase_retencion = 'En Central' AND e.fecha_fin_central IS NOT NULL
                         AND e.fecha_fin_central <= CURDATE() THEN 'Vencido en Central'
                    WHEN e.fase_retencion = 'En Gestión' AND e.fecha_fin_gestion IS NOT NULL
                         AND e.fecha_fin_gestion <= CURDATE() THEN 'Vencido en Gestión'
                    WHEN e.fase_retencion = 'En Central' AND e.fecha_fin_central IS NOT NULL
                         AND e.fecha_fin_central <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Próximo a vencer en Central'
                    WHEN e.fase_retencion = 'En Gestión' AND e.fecha_fin_gestion IS NOT NULL
                         AND e.fecha_fin_gestion <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Próximo a vencer en Gestión'
                    ELSE 'Vigente'
                END as estado_retencion,
                
                (SELECT COUNT(*) FROM retencion_notificaciones rn WHERE rn.id_expediente = e.id AND rn.estado = 'Pendiente') as tiene_notificacion_pendiente
                
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            LEFT JOIN usuarios u ON e.id_usuario_responsable = u.id
            WHERE e.fecha_cierre IS NOT NULL
            AND e.fase_retencion IN ('En Gestión', 'En Central', 'Histórico', 'Eliminable')
            ${filterConditions}
            HAVING estado_retencion != 'Vigente'
            ORDER BY 
                CASE estado_retencion 
                    WHEN 'Vencido - Eliminable' THEN 1
                    WHEN 'Vencido - Histórico' THEN 2
                    WHEN 'Vencido en Central' THEN 3
                    WHEN 'Vencido en Gestión' THEN 4
                    WHEN 'Próximo a vencer en Central' THEN 5
                    WHEN 'Próximo a vencer en Gestión' THEN 6
                END,
                e.fecha_fin_central ASC
            LIMIT ? OFFSET ?
        `;

        // Query de conteo total (sin límite y sin columnas pesadas)
        // Nota: HAVING en COUNT es complejo, usamos subquery o aproximación.
        // Dado que el filtro es por `estado_retencion` calculado, necesitamos la lógica completa.
        // Para optimizar, asumimos que el filtro de fecha/oficina reduce el set.
        // Haremos un count sobre la query sin limit.
        const countQuery = `
            SELECT COUNT(*) as total FROM (
                SELECT e.id,
                CASE 
                    WHEN e.fase_retencion = 'Eliminable' THEN 'Vencido - Eliminable'
                    WHEN e.fase_retencion = 'Histórico' THEN 'Vencido - Histórico'
                    WHEN e.fase_retencion = 'En Central' AND e.fecha_fin_central <= CURDATE() THEN 'Vencido en Central'
                    WHEN e.fase_retencion = 'En Gestión' AND e.fecha_fin_gestion <= CURDATE() THEN 'Vencido en Gestión'
                    WHEN e.fase_retencion = 'En Central' AND e.fecha_fin_central <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Próximo a vencer en Central'
                    WHEN e.fase_retencion = 'En Gestión' AND e.fecha_fin_gestion <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Próximo a vencer en Gestión'
                    ELSE 'Vigente'
                END as estado_retencion
                FROM expedientes e
                LEFT JOIN trd_series s ON e.id_serie = s.id
                LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
                LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
                WHERE e.fecha_cierre IS NOT NULL
                AND e.fase_retencion IN ('En Gestión', 'En Central', 'Histórico', 'Eliminable')
                ${filterConditions}
                HAVING estado_retencion != 'Vigente'
            ) as sub
        `;

        const [rows] = await pool.query(query, [...params, limit, offset]);
        const [countRow] = await pool.query(countQuery, params);
        const total = countRow[0].total;

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error en getExpedientesVencidos:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Procesamiento masivo de expedientes (Conservar, Eliminar, Transferir)
 */
exports.procesarMasivo = async (req, res) => {
    const { ids, accion, observaciones } = req.body;
    const id_usuario = req.user.id; // Asumiendo middleware de auth

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'Debe proporcionar una lista de IDs.' });
    }
    if (!accion || !['Conservado', 'Eliminado', 'Transferir'].includes(accion)) {
        return res.status(400).json({ msg: 'Acción inválida.' });
    }

    const connection = await pool.getConnection(); // Usar transacción
    try {
        await connection.beginTransaction();

        let processedCount = 0;
        const errors = [];

        for (const id of ids) {
            try {
                // Obtener datos del expediente para log y validación
                const [expData] = await connection.query(`
                    SELECT e.*, 
                           COALESCE(ss.disposicion_final, s.disposicion_final) as disposicion_final
                    FROM expedientes e
                    LEFT JOIN trd_series s ON e.id_serie = s.id
                    LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
                    WHERE e.id = ? FOR UPDATE
                `, [id]);

                if (expData.length === 0) {
                    errors.push(`ID ${id}: No encontrado`);
                    continue;
                }
                const exp = expData[0];

                if (accion === 'Transferir') {
                    if (exp.estado !== 'Cerrado en Gestión') {
                        errors.push(`ID ${id} (${exp.nombre_expediente}): No está "Cerrado en Gestión"`);
                        continue;
                    }
                    await connection.query(`
                        UPDATE expedientes SET estado = 'Cerrado en Central', fase_retencion = 'En Central' WHERE id = ?
                    `, [id]);

                    // Auditoría masiva (simplificada)
                    await connection.query(`
                       INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, detalles)
                       VALUES (?, 'Transferencia Masiva', 'expedientes', ?, ?)
                    `, [id_usuario, id, JSON.stringify({ obs: observaciones })]);

                } else {
                    // Conservar o Eliminar
                    const tipoRetencion = exp.fase_retencion === 'En Gestión' ? 'Gestión' : 'Central';
                    const fechaVencimiento = tipoRetencion === 'Gestión' ? exp.fecha_fin_gestion : exp.fecha_fin_central;

                    // Notificación histórica
                    await connection.query(`
                        INSERT INTO retencion_notificaciones 
                        (id_expediente, tipo_retencion, fecha_vencimiento, disposicion_final, estado, fecha_procesado, id_usuario_proceso, observaciones)
                        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
                    `, [id, tipoRetencion, fechaVencimiento, exp.disposicion_final || 'Conservación Total', accion, id_usuario, observaciones]);

                    if (accion === 'Eliminado') {
                        await connection.query(`
                            UPDATE expedientes SET estado = 'Eliminable', fase_retencion = 'Eliminable', disponibilidad = 'No disponible' WHERE id = ?
                        `, [id]);
                    } else { // Conservado
                        await connection.query(`
                            UPDATE expedientes SET estado = 'Histórico', fase_retencion = 'Histórico' WHERE id = ?
                        `, [id]);
                    }

                    await connection.query(`
                       INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, detalles)
                       VALUES (?, ?, 'expedientes', ?, ?)
                    `, [id_usuario, `Retención Masiva: ${accion}`, id, JSON.stringify({ obs: observaciones })]);
                }

                processedCount++;

            } catch (err) {
                console.error(`Error procesando ID ${id}:`, err);
                errors.push(`ID ${id}: Error interno`);
            }
        }

        await connection.commit();
        res.json({
            msg: `Procesamiento completado. ${processedCount} expedientes procesados.`,
            processedCount,
            errors,
            success: processedCount > 0
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error en procesarMasivo:', error);
        res.status(500).json({ msg: 'Error de servidor en procesamiento masivo', error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * Obtiene el resumen/estadísticas de retención por fase
 */
exports.getResumenRetencion = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                SUM(CASE WHEN fase_retencion = 'Vigente' THEN 1 ELSE 0 END) as vigentes,
                SUM(CASE WHEN fase_retencion = 'En Gestión' THEN 1 ELSE 0 END) as en_gestion,
                SUM(CASE WHEN fase_retencion = 'En Central' THEN 1 ELSE 0 END) as en_central,
                SUM(CASE WHEN fase_retencion = 'Histórico' THEN 1 ELSE 0 END) as historicos,
                SUM(CASE WHEN fase_retencion = 'Eliminable' THEN 1 ELSE 0 END) as eliminables,
                SUM(CASE WHEN fecha_fin_gestion IS NOT NULL AND fecha_fin_gestion <= CURDATE() 
                         AND fase_retencion = 'En Gestión' THEN 1 ELSE 0 END) as vencidos_gestion,
                SUM(CASE WHEN fecha_fin_central IS NOT NULL AND fecha_fin_central <= CURDATE() 
                         AND fase_retencion = 'En Central' THEN 1 ELSE 0 END) as vencidos_central,
                SUM(CASE WHEN fecha_fin_gestion IS NOT NULL 
                         AND fecha_fin_gestion BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
                         AND fase_retencion = 'En Gestión' THEN 1 ELSE 0 END) as proximos_gestion,
                SUM(CASE WHEN fecha_fin_central IS NOT NULL 
                         AND fecha_fin_central BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
                         AND fase_retencion = 'En Central' THEN 1 ELSE 0 END) as proximos_central,
                COUNT(*) as total_expedientes
            FROM expedientes
            WHERE estado != 'En trámite' OR fase_retencion != 'Vigente'
        `);

        // Obtener notificaciones pendientes
        const [notificaciones] = await pool.query(`
            SELECT COUNT(*) as pendientes 
            FROM retencion_notificaciones 
            WHERE estado = 'Pendiente'
        `);

        // Obtener alertas no leídas
        const [alertas] = await pool.query(`
            SELECT COUNT(*) as no_leidas
            FROM retencion_alertas
            WHERE leida = 0
        `);

        const s = stats[0];
        res.json({
            vigentes: s.vigentes || 0,
            en_gestion: s.en_gestion || 0,
            en_central: s.en_central || 0,
            historicos: s.historicos || 0,
            eliminables: s.eliminables || 0,
            vencidos_gestion: s.vencidos_gestion || 0,
            vencidos_central: s.vencidos_central || 0,
            proximos_gestion: s.proximos_gestion || 0,
            proximos_central: s.proximos_central || 0,
            total_vencidos: (s.vencidos_gestion || 0) + (s.vencidos_central || 0),
            total_proximos: (s.proximos_gestion || 0) + (s.proximos_central || 0),
            total_expedientes: s.total_expedientes || 0,
            notificaciones_pendientes: notificaciones[0].pendientes || 0,
            alertas_no_leidas: alertas[0].no_leidas || 0
        });
    } catch (error) {
        console.error('Error en getResumenRetencion:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Dashboard de retención: expedientes por fase con alertas
 */
exports.getDashboardRetencion = async (req, res) => {
    try {
        // Expedientes por fase
        const [porFase] = await pool.query(`
            SELECT 
                e.fase_retencion,
                COUNT(*) as cantidad,
                COALESCE(ss.disposicion_final, s.disposicion_final, 'Sin definir') as disposicion_final
            FROM expedientes e
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            GROUP BY e.fase_retencion, disposicion_final
            ORDER BY 
                FIELD(e.fase_retencion, 'Vigente', 'En Gestión', 'En Central', 'Histórico', 'Eliminable')
        `);

        // Próximos a cambiar de fase (30 días)
        const [proximosCambio] = await pool.query(`
            SELECT 
                e.id,
                e.nombre_expediente,
                e.fase_retencion,
                e.fecha_fin_gestion,
                e.fecha_fin_central,
                s.nombre_serie,
                ss.nombre_subserie,
                o.nombre_oficina,
                COALESCE(ss.disposicion_final, s.disposicion_final) as disposicion_final,
                CASE 
                    WHEN e.fase_retencion = 'En Gestión' THEN e.fecha_fin_gestion
                    WHEN e.fase_retencion = 'En Central' THEN e.fecha_fin_central
                    ELSE NULL
                END as fecha_cambio,
                CASE 
                    WHEN e.fase_retencion = 'En Gestión' THEN DATEDIFF(e.fecha_fin_gestion, CURDATE())
                    WHEN e.fase_retencion = 'En Central' THEN DATEDIFF(e.fecha_fin_central, CURDATE())
                    ELSE NULL
                END as dias_restantes
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            WHERE (
                (e.fase_retencion = 'En Gestión' AND e.fecha_fin_gestion BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
                OR
                (e.fase_retencion = 'En Central' AND e.fecha_fin_central BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
            )
            ORDER BY dias_restantes ASC
            LIMIT 20
        `);

        // Alertas activas (no leídas)
        const [alertas] = await pool.query(`
            SELECT 
                a.*,
                e.nombre_expediente,
                s.nombre_serie,
                o.nombre_oficina
            FROM retencion_alertas a
            JOIN expedientes e ON a.id_expediente = e.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            WHERE a.leida = 0
            ORDER BY a.fecha_limite ASC
            LIMIT 50
        `);

        // Estadísticas por oficina
        const [porOficina] = await pool.query(`
            SELECT 
                o.nombre_oficina,
                o.id as id_oficina,
                SUM(CASE WHEN e.fase_retencion = 'Vigente' THEN 1 ELSE 0 END) as vigentes,
                SUM(CASE WHEN e.fase_retencion = 'En Gestión' THEN 1 ELSE 0 END) as en_gestion,
                SUM(CASE WHEN e.fase_retencion = 'En Central' THEN 1 ELSE 0 END) as en_central,
                SUM(CASE WHEN e.fase_retencion = 'Histórico' THEN 1 ELSE 0 END) as historicos,
                SUM(CASE WHEN e.fase_retencion = 'Eliminable' THEN 1 ELSE 0 END) as eliminables,
                COUNT(*) as total
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            GROUP BY o.id, o.nombre_oficina
            HAVING total > 0
            ORDER BY total DESC
        `);

        res.json({
            porFase,
            proximosCambio,
            alertas,
            porOficina
        });
    } catch (error) {
        console.error('Error en getDashboardRetencion:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtener alertas de retención
 */
exports.getAlertas = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                a.*,
                e.nombre_expediente,
                e.fase_retencion,
                s.nombre_serie,
                ss.nombre_subserie,
                o.nombre_oficina,
                COALESCE(ss.disposicion_final, s.disposicion_final) as disposicion_final
            FROM retencion_alertas a
            JOIN expedientes e ON a.id_expediente = e.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            ORDER BY a.leida ASC, a.fecha_limite ASC
            LIMIT 100
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error en getAlertas:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Marcar alerta como leída
 */
exports.marcarAlertaLeida = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE retencion_alertas SET leida = 1 WHERE id = ?', [id]);
        res.json({ msg: 'Alerta marcada como leída.' });
    } catch (error) {
        console.error('Error en marcarAlertaLeida:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Procesa un expediente vencido (conservar o eliminar)
 */
exports.procesarExpediente = async (req, res) => {
    const { id } = req.params;
    const { accion, observaciones } = req.body;
    const id_usuario = req.user.id;

    if (!accion || !['Conservado', 'Eliminado'].includes(accion)) {
        return res.status(400).json({ msg: 'Acción inválida. Debe ser "Conservado" o "Eliminado".' });
    }

    try {
        // Obtener información del expediente
        const [expediente] = await pool.query(`
            SELECT e.*, 
                   COALESCE(ss.disposicion_final, s.disposicion_final) as disposicion_final,
                   COALESCE(ss.retencion_gestion, s.retencion_gestion) as retencion_gestion,
                   COALESCE(ss.retencion_central, s.retencion_central) as retencion_central
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            WHERE e.id = ?
        `, [id]);

        if (expediente.length === 0) {
            return res.status(404).json({ msg: 'Expediente no encontrado.' });
        }

        const exp = expediente[0];

        // Determinar tipo de retención según fase actual
        const tipoRetencion = exp.fase_retencion === 'En Gestión' ? 'Gestión' : 'Central';

        // Fecha de vencimiento desde columnas precalculadas
        const fechaVencimiento = tipoRetencion === 'Gestión' ? exp.fecha_fin_gestion : exp.fecha_fin_central;

        // Registrar en la tabla de notificaciones
        await pool.query(`
            INSERT INTO retencion_notificaciones 
            (id_expediente, tipo_retencion, fecha_vencimiento, disposicion_final, estado, fecha_procesado, id_usuario_proceso, observaciones)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [id, tipoRetencion, fechaVencimiento, exp.disposicion_final || 'Conservación Total', accion, id_usuario, observaciones]);

        // Si es eliminación, marcar el expediente
        if (accion === 'Eliminado') {
            await pool.query(`
                UPDATE expedientes 
                SET estado = 'Eliminable', 
                    fase_retencion = 'Eliminable',
                    disponibilidad = 'No disponible'
                WHERE id = ?
            `, [id]);
        } else {
            // Conservado -> Histórico
            await pool.query(`
                UPDATE expedientes 
                SET estado = 'Histórico',
                    fase_retencion = 'Histórico'
                WHERE id = ?
            `, [id]);
        }

        // Registrar en auditoría
        await pool.query(`
            INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, detalles)
            VALUES (?, ?, 'expedientes', ?, ?)
        `, [id_usuario, `Retención TRD: ${accion}`, id, JSON.stringify({
            expediente: exp.nombre_expediente,
            disposicion_final: exp.disposicion_final,
            observaciones
        })]);

        res.json({
            msg: `Expediente procesado correctamente como "${accion}".`,
            accion,
            expediente_id: id
        });
    } catch (error) {
        console.error('Error en procesarExpediente:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtiene el historial de procesamientos de retención
 */
exports.getHistorialRetencion = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                rn.*,
                e.nombre_expediente,
                s.nombre_serie,
                ss.nombre_subserie,
                u.nombre_completo as procesado_por
            FROM retencion_notificaciones rn
            LEFT JOIN expedientes e ON rn.id_expediente = e.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN usuarios u ON rn.id_usuario_proceso = u.id
            WHERE rn.estado IN ('Conservado', 'Eliminado')
            ORDER BY rn.fecha_procesado DESC
            LIMIT 100
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error en getHistorialRetencion:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Transferir expediente de Gestión a Central
 */
exports.transferirACentral = async (req, res) => {
    const { id } = req.params;
    const { observaciones } = req.body;
    const id_usuario = req.user.id;

    try {
        const [expediente] = await pool.query('SELECT * FROM expedientes WHERE id = ?', [id]);

        if (expediente.length === 0) {
            return res.status(404).json({ msg: 'Expediente no encontrado.' });
        }

        if (expediente[0].estado !== 'Cerrado en Gestión') {
            return res.status(400).json({ msg: 'Solo se pueden transferir expedientes cerrados en Gestión.' });
        }

        await pool.query(`
            UPDATE expedientes 
            SET estado = 'Cerrado en Central',
                fase_retencion = 'En Central'
            WHERE id = ?
        `, [id]);

        // Registrar en auditoría
        await pool.query(`
            INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, detalles)
            VALUES (?, 'Transferencia a Archivo Central', 'expedientes', ?, ?)
        `, [id_usuario, id, JSON.stringify({
            expediente: expediente[0].nombre_expediente,
            observaciones
        })]);

        res.json({ msg: 'Expediente transferido a Archivo Central exitosamente.' });
    } catch (error) {
        console.error('Error en transferirACentral:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Ejecutar job de retención manualmente
 */
exports.ejecutarJob = async (req, res) => {
    try {
        const { actualizarRetencion } = require('../jobs/retencion.job');
        await actualizarRetencion();
        res.json({ msg: 'Job de retención ejecutado correctamente.' });
    } catch (error) {
        console.error('Error al ejecutar job:', error);
        res.status(500).json({ msg: 'Error al ejecutar job', error: error.message });
    }
};
