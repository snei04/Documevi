const pool = require('../config/db');

/**
 * Obtiene expedientes que han cumplido o están próximos a cumplir su tiempo de retención
 * Calcula basándose en fecha_cierre + años de retención según TRD
 */
exports.getExpedientesVencidos = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                e.id,
                e.nombre_expediente,
                e.fecha_cierre,
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
                
                -- Calcular fechas de vencimiento
                DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR) as fecha_fin_gestion,
                DATE_ADD(
                    DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR),
                    INTERVAL COALESCE(ss.retencion_central, s.retencion_central, 0) YEAR
                ) as fecha_fin_central,
                
                -- Determinar estado de retención
                CASE 
                    WHEN e.estado = 'Cerrado en Gestión' AND 
                         DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR) <= CURDATE()
                    THEN 'Vencido en Gestión'
                    WHEN e.estado = 'Cerrado en Central' AND 
                         DATE_ADD(
                            DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR),
                            INTERVAL COALESCE(ss.retencion_central, s.retencion_central, 0) YEAR
                         ) <= CURDATE()
                    THEN 'Vencido en Central'
                    WHEN e.estado = 'Cerrado en Gestión' AND 
                         DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR) <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
                    THEN 'Próximo a vencer en Gestión'
                    WHEN e.estado = 'Cerrado en Central' AND 
                         DATE_ADD(
                            DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR),
                            INTERVAL COALESCE(ss.retencion_central, s.retencion_central, 0) YEAR
                         ) <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
                    THEN 'Próximo a vencer en Central'
                    ELSE 'Vigente'
                END as estado_retencion,
                
                -- Verificar si ya tiene notificación
                (SELECT COUNT(*) FROM retencion_notificaciones rn WHERE rn.id_expediente = e.id AND rn.estado = 'Pendiente') as tiene_notificacion_pendiente
                
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            LEFT JOIN usuarios u ON e.id_usuario_responsable = u.id
            WHERE e.fecha_cierre IS NOT NULL
            AND e.estado IN ('Cerrado en Gestión', 'Cerrado en Central')
            HAVING estado_retencion IN ('Vencido en Gestión', 'Vencido en Central', 'Próximo a vencer en Gestión', 'Próximo a vencer en Central')
            ORDER BY 
                CASE estado_retencion 
                    WHEN 'Vencido en Central' THEN 1
                    WHEN 'Vencido en Gestión' THEN 2
                    WHEN 'Próximo a vencer en Central' THEN 3
                    WHEN 'Próximo a vencer en Gestión' THEN 4
                END,
                fecha_fin_central ASC
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('Error en getExpedientesVencidos:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtiene el resumen/estadísticas de retención
 */
exports.getResumenRetencion = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                SUM(CASE WHEN estado_retencion = 'Vencido en Gestión' THEN 1 ELSE 0 END) as vencidos_gestion,
                SUM(CASE WHEN estado_retencion = 'Vencido en Central' THEN 1 ELSE 0 END) as vencidos_central,
                SUM(CASE WHEN estado_retencion = 'Próximo a vencer en Gestión' THEN 1 ELSE 0 END) as proximos_gestion,
                SUM(CASE WHEN estado_retencion = 'Próximo a vencer en Central' THEN 1 ELSE 0 END) as proximos_central
            FROM (
                SELECT 
                    e.id,
                    CASE 
                        WHEN e.estado = 'Cerrado en Gestión' AND 
                             DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR) <= CURDATE()
                        THEN 'Vencido en Gestión'
                        WHEN e.estado = 'Cerrado en Central' AND 
                             DATE_ADD(
                                DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR),
                                INTERVAL COALESCE(ss.retencion_central, s.retencion_central, 0) YEAR
                             ) <= CURDATE()
                        THEN 'Vencido en Central'
                        WHEN e.estado = 'Cerrado en Gestión' AND 
                             DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR) <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
                        THEN 'Próximo a vencer en Gestión'
                        WHEN e.estado = 'Cerrado en Central' AND 
                             DATE_ADD(
                                DATE_ADD(e.fecha_cierre, INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR),
                                INTERVAL COALESCE(ss.retencion_central, s.retencion_central, 0) YEAR
                             ) <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
                        THEN 'Próximo a vencer en Central'
                        ELSE 'Vigente'
                    END as estado_retencion
                FROM expedientes e
                LEFT JOIN trd_series s ON e.id_serie = s.id
                LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
                WHERE e.fecha_cierre IS NOT NULL
                AND e.estado IN ('Cerrado en Gestión', 'Cerrado en Central')
            ) as subquery
        `);
        
        // Obtener notificaciones pendientes
        const [notificaciones] = await pool.query(`
            SELECT COUNT(*) as pendientes 
            FROM retencion_notificaciones 
            WHERE estado = 'Pendiente'
        `);
        
        res.json({
            vencidos_gestion: stats[0].vencidos_gestion || 0,
            vencidos_central: stats[0].vencidos_central || 0,
            proximos_gestion: stats[0].proximos_gestion || 0,
            proximos_central: stats[0].proximos_central || 0,
            total_vencidos: (stats[0].vencidos_gestion || 0) + (stats[0].vencidos_central || 0),
            total_proximos: (stats[0].proximos_gestion || 0) + (stats[0].proximos_central || 0),
            notificaciones_pendientes: notificaciones[0].pendientes || 0
        });
    } catch (error) {
        console.error('Error en getResumenRetencion:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Procesa un expediente vencido (conservar o eliminar)
 */
exports.procesarExpediente = async (req, res) => {
    const { id } = req.params;
    const { accion, observaciones } = req.body;
    const id_usuario = req.usuario.id;
    
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
        
        // Determinar tipo de retención según estado actual
        const tipoRetencion = exp.estado === 'Cerrado en Gestión' ? 'Gestión' : 'Central';
        
        // Calcular fecha de vencimiento
        let fechaVencimiento;
        if (tipoRetencion === 'Gestión') {
            fechaVencimiento = new Date(exp.fecha_cierre);
            fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + (exp.retencion_gestion || 0));
        } else {
            fechaVencimiento = new Date(exp.fecha_cierre);
            fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + (exp.retencion_gestion || 0) + (exp.retencion_central || 0));
        }
        
        // Registrar en la tabla de notificaciones
        await pool.query(`
            INSERT INTO retencion_notificaciones 
            (id_expediente, tipo_retencion, fecha_vencimiento, disposicion_final, estado, fecha_procesado, id_usuario_proceso, observaciones)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [id, tipoRetencion, fechaVencimiento, exp.disposicion_final || 'Conservación Total', accion, id_usuario, observaciones]);
        
        // Si es eliminación, marcar el expediente (no eliminamos físicamente)
        if (accion === 'Eliminado') {
            await pool.query(`
                UPDATE expedientes 
                SET estado = 'Eliminado por TRD', 
                    disponibilidad = 'No disponible'
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
    const id_usuario = req.usuario.id;
    
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
            SET estado = 'Cerrado en Central'
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
