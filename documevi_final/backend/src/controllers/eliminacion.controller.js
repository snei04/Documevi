const pool = require('../config/db');
const fs = require('fs/promises');

// Función para encontrar expedientes que se pueden eliminar
exports.getExpedientesElegibles = async (req, res) => {
    try {
        
        const [rows] = await pool.query(`
            SELECT e.id, e.nombre_expediente, s.nombre_serie, ss.nombre_subserie, e.fecha_cierre,
                   (ss.retencion_gestion + ss.retencion_central) as retencion_total
            FROM expedientes e
            JOIN trd_subseries ss ON e.id_subserie = ss.id
            JOIN trd_series s ON e.id_serie = s.id
            WHERE ss.disposicion_final = 'Eliminación'
              AND e.estado = 'Cerrado en Central'
              AND e.fecha_cierre IS NOT NULL
              AND DATE_ADD(e.fecha_cierre, INTERVAL (ss.retencion_gestion + ss.retencion_central) YEAR) < NOW()
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error al buscar expedientes para eliminar:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Función para ejecutar la eliminación
exports.eliminarExpedientes = async (req, res) => {
    const { expedientesIds, motivo } = req.body;
    const id_usuario_eliminador = req.user.id;

    if (!expedientesIds || !Array.isArray(expedientesIds) || expedientesIds.length === 0) {
        return res.status(400).json({ msg: 'Se requiere un listado de IDs de expedientes.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const id of expedientesIds) {
            // 1. Mover los metadatos del expediente a la tabla de eliminados
            await connection.query(
                `INSERT INTO expedientes_eliminados (id, nombre_expediente, id_serie, id_subserie, fecha_apertura, fecha_cierre, id_usuario_responsable, id_usuario_eliminador, motivo_eliminacion)
                 SELECT id, nombre_expediente, id_serie, id_subserie, fecha_apertura, fecha_cierre, id_usuario_responsable, ?, ? FROM expedientes WHERE id = ?`,
                [id_usuario_eliminador, motivo, id]
            );

            // 2. Borrar los archivos físicos asociados a los documentos del expediente
            const [documentos] = await connection.query('SELECT d.path_archivo FROM documentos d JOIN expediente_documentos ed ON d.id = ed.id_documento WHERE ed.id_expediente = ?', [id]);
            for (const doc of documentos) {
                if (doc.path_archivo) {
                    try {
                        await fs.unlink(doc.path_archivo); // Borrado seguro del archivo
                    } catch (fileError) {
                        console.error(`No se pudo eliminar el archivo ${doc.path_archivo}:`, fileError.message);
                    }
                }
            }

            // 3. Eliminar el expediente de la tabla principal (esto eliminará en cascada los documentos asociados)
            await connection.query('DELETE FROM expedientes WHERE id = ?', [id]);
        }

        // 4. Registrar en la auditoría
        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario_eliminador, 'ELIMINACION_EXPEDIENTES', `Se eliminaron ${expedientesIds.length} expedientes. Motivo: ${motivo}. IDs: ${expedientesIds.join(', ')}`]
        );

        await connection.commit();
        res.json({ msg: `${expedientesIds.length} expedientes han sido eliminados con éxito.` });

    } catch (error) {
        await connection.rollback();
        console.error("Error al eliminar expedientes:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        connection.release();
    }
};