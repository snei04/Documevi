const pool = require('../config/db');
const cron = require('node-cron');

/**
 * Job de Retención Documental
 * Se ejecuta diariamente a las 2:00 AM para:
 * 1. Calcular fecha_primer_documento
 * 2. Calcular fecha_inicio_retencion
 * 3. Calcular fechas estimadas de fin gestión/central
 * 4. Actualizar fase_retencion
 * 5. Generar alertas 30 días antes de cada cambio de fase
 * 6. Actualizar estado del expediente automáticamente
 */

const actualizarRetencion = async () => {
    console.log('[CRON Retención] Iniciando actualización de retención documental...');
    const startTime = Date.now();

    try {
        // === PASO 1: Calcular fecha_primer_documento ===
        await pool.query(`
            UPDATE expedientes e 
            SET fecha_primer_documento = (
                SELECT MIN(d.fecha_radicado) 
                FROM expediente_documentos ed 
                JOIN documentos d ON ed.id_documento = d.id 
                WHERE ed.id_expediente = e.id
            )
            WHERE e.fecha_primer_documento IS NULL
            AND EXISTS (
                SELECT 1 FROM expediente_documentos ed WHERE ed.id_expediente = e.id
            )
        `);

        // === PASO 2: Calcular fecha_inicio_retencion ===
        await pool.query(`
            UPDATE expedientes 
            SET fecha_inicio_retencion = COALESCE(fecha_cierre, fecha_primer_documento, fecha_apertura)
            WHERE fecha_inicio_retencion IS NULL
        `);

        // === PASO 3: Calcular fechas estimadas ===
        await pool.query(`
            UPDATE expedientes e
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            SET 
                e.fecha_fin_gestion = DATE_ADD(
                    e.fecha_inicio_retencion, 
                    INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR
                ),
                e.fecha_fin_central = DATE_ADD(
                    DATE_ADD(
                        e.fecha_inicio_retencion, 
                        INTERVAL COALESCE(ss.retencion_gestion, s.retencion_gestion, 0) YEAR
                    ),
                    INTERVAL COALESCE(ss.retencion_central, s.retencion_central, 0) YEAR
                )
            WHERE e.fecha_inicio_retencion IS NOT NULL
            AND (e.fecha_fin_gestion IS NULL OR e.fecha_fin_central IS NULL)
        `);

        // === PASO 4: Actualizar fase_retencion ===
        const [updatedFases] = await pool.query(`
            UPDATE expedientes e
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            SET e.fase_retencion = CASE
                WHEN e.estado = 'En trámite' THEN 'Vigente'
                WHEN e.fecha_fin_central IS NOT NULL AND CURDATE() >= e.fecha_fin_central 
                     AND COALESCE(ss.disposicion_final, s.disposicion_final) = 'Eliminación' 
                     THEN 'Eliminable'
                WHEN e.fecha_fin_central IS NOT NULL AND CURDATE() >= e.fecha_fin_central 
                     AND COALESCE(ss.disposicion_final, s.disposicion_final) IN ('Conservación Total', 'Selección') 
                     THEN 'Histórico'
                WHEN e.fecha_fin_gestion IS NOT NULL AND CURDATE() >= e.fecha_fin_gestion 
                     THEN 'En Central'
                WHEN e.fecha_cierre IS NOT NULL 
                     THEN 'En Gestión'
                ELSE 'Vigente'
            END
        `);

        // === PASO 5: Generar alertas 30 días antes ===
        // Alerta: próximo a salir de gestión
        await pool.query(`
            INSERT IGNORE INTO retencion_alertas (id_expediente, tipo_alerta, fecha_alerta, fecha_limite)
            SELECT e.id, 'Próximo a Gestión', CURDATE(), e.fecha_fin_gestion
            FROM expedientes e
            WHERE e.fase_retencion = 'En Gestión'
            AND e.fecha_fin_gestion IS NOT NULL
            AND e.fecha_fin_gestion BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `);

        // Alerta: próximo a salir de central
        await pool.query(`
            INSERT IGNORE INTO retencion_alertas (id_expediente, tipo_alerta, fecha_alerta, fecha_limite)
            SELECT e.id, 'Próximo a Central', CURDATE(), e.fecha_fin_central
            FROM expedientes e
            WHERE e.fase_retencion = 'En Central'
            AND e.fecha_fin_central IS NOT NULL
            AND e.fecha_fin_central BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `);

        // Alerta: próximo a disposición final
        await pool.query(`
            INSERT IGNORE INTO retencion_alertas (id_expediente, tipo_alerta, fecha_alerta, fecha_limite)
            SELECT e.id, 'Próximo a Disposición', CURDATE(), e.fecha_fin_central
            FROM expedientes e
            WHERE e.fecha_fin_central IS NOT NULL
            AND e.fecha_fin_central BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND e.fase_retencion NOT IN ('Histórico', 'Eliminable')
        `);

        // === PASO 6: Actualizar estado del expediente ===
        // Expedientes que pasaron de gestión a central
        await pool.query(`
            UPDATE expedientes 
            SET estado = 'Cerrado en Central'
            WHERE fase_retencion = 'En Central' 
            AND estado = 'Cerrado en Gestión'
        `);

        // Expedientes que llegaron a histórico
        await pool.query(`
            UPDATE expedientes 
            SET estado = 'Histórico'
            WHERE fase_retencion = 'Histórico' 
            AND estado NOT IN ('Histórico', 'Eliminable')
        `);

        // Expedientes eliminables
        await pool.query(`
            UPDATE expedientes 
            SET estado = 'Eliminable'
            WHERE fase_retencion = 'Eliminable' 
            AND estado != 'Eliminable'
        `);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[CRON Retención] ✅ Completado en ${elapsed}s. Fases actualizadas: ${updatedFases.affectedRows}`);

    } catch (error) {
        console.error('[CRON Retención] ❌ Error:', error.message);
    }
};

/**
 * Inicia el job programado
 */
const iniciarJobRetencion = () => {
    // Ejecutar diariamente a las 2:00 AM
    cron.schedule('0 2 * * *', () => {
        actualizarRetencion();
    });

    console.log('[CRON Retención] 📅 Job programado: diariamente a las 2:00 AM');

    // También ejecutar una vez al iniciar el servidor
    setTimeout(() => {
        console.log('[CRON Retención] 🔄 Ejecución inicial al arrancar servidor...');
        actualizarRetencion();
    }, 5000); // Esperar 5s para que pool esté listo
};

module.exports = { iniciarJobRetencion, actualizarRetencion };
