const pool = require('../config/db');

// Obtener todas las subseries
exports.getAllSubseries = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ss.*, s.nombre_serie 
            FROM trd_subseries ss
            LEFT JOIN trd_series s ON ss.id_serie = s.id
            ORDER BY ss.activo DESC, ss.nombre_subserie ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};


// Crear una nueva subserie
exports.createSubserie = async (req, res) => {
  const { 
    id_serie, 
    codigo_subserie, 
    nombre_subserie,
    retencion_gestion,
    retencion_central,
    disposicion_final,
    procedimientos 
  } = req.body;

  if (!id_serie || !codigo_subserie || !nombre_subserie) {
    return res.status(400).json({ msg: 'Serie, código y nombre son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO trd_subseries (id_serie, codigo_subserie, nombre_subserie, retencion_gestion, retencion_central, disposicion_final, procedimientos) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_serie, codigo_subserie, nombre_subserie, retencion_gestion, retencion_central, disposicion_final, procedimientos]
    );
    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la subserie ya existe para esa serie.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};
// Actualizar una subserie existente
exports.updateSubserie = async (req, res) => {
    const { id } = req.params;
    const { nombre_subserie, codigo_subserie, id_serie, retencion_gestion, retencion_central, disposicion_final } = req.body;

    if (!nombre_subserie || !codigo_subserie || !id_serie) {
        return res.status(400).json({ msg: 'Nombre, código y serie son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE trd_subseries SET nombre_subserie = ?, codigo_subserie = ?, id_serie = ?, retencion_gestion = ?, retencion_central = ?, disposicion_final = ? WHERE id = ?',
            [nombre_subserie, codigo_subserie, id_serie, retencion_gestion, retencion_central, disposicion_final, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Subserie no encontrada.' });
        }
        res.json({ msg: 'Subserie actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Activa o desactiva una subserie
exports.toggleSubserieStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE trd_subseries SET activo = NOT activo WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Subserie no encontrada.' });
        }
        res.json({ msg: 'Estado de la subserie actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Carga masiva de subseries desde Excel
exports.bulkCreateSubseries = async (req, res) => {
    const { subseries } = req.body;

    if (!subseries || !Array.isArray(subseries) || subseries.length === 0) {
        return res.status(400).json({ msg: 'Debe proporcionar un array de subseries.' });
    }

    // Obtener todas las series para mapear código -> id
    const [seriesRows] = await pool.query('SELECT id, codigo_serie FROM trd_series WHERE activo = 1');
    const seriesMap = {};
    seriesRows.forEach(serie => {
        seriesMap[String(serie.codigo_serie).trim()] = serie.id;
    });

    const resultados = {
        creadas: 0,
        errores: [],
        duplicados: []
    };

    for (let i = 0; i < subseries.length; i++) {
        const sub = subseries[i];
        const fila = i + 2;

        // Validar campos obligatorios
        if (!sub.codigo_serie || !sub.codigo_subserie || !sub.nombre_subserie) {
            resultados.errores.push({
                fila,
                mensaje: 'Código serie, código subserie y nombre son obligatorios',
                datos: sub
            });
            continue;
        }

        // Buscar el id de la serie por su código
        const idSerie = seriesMap[String(sub.codigo_serie).trim()];
        if (!idSerie) {
            resultados.errores.push({
                fila,
                mensaje: `Serie con código "${sub.codigo_serie}" no encontrada`,
                datos: sub
            });
            continue;
        }

        // Valores opcionales
        const retencionGestion = sub.retencion_gestion || null;
        const retencionCentral = sub.retencion_central || null;
        const disposicionFinal = sub.disposicion_final || 'Conservación Total';
        const procedimientos = sub.procedimientos || null;

        try {
            await pool.query(
                `INSERT INTO trd_subseries (id_serie, codigo_subserie, nombre_subserie, retencion_gestion, retencion_central, disposicion_final, procedimientos) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idSerie, String(sub.codigo_subserie).trim(), String(sub.nombre_subserie).trim(), retencionGestion, retencionCentral, disposicionFinal, procedimientos]
            );
            resultados.creadas++;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                resultados.duplicados.push({
                    fila,
                    codigo_subserie: sub.codigo_subserie,
                    nombre_subserie: sub.nombre_subserie
                });
            } else {
                resultados.errores.push({
                    fila,
                    mensaje: error.message,
                    datos: sub
                });
            }
        }
    }

    const mensaje = `Carga completada: ${resultados.creadas} subseries creadas, ${resultados.duplicados.length} duplicados, ${resultados.errores.length} errores.`;
    
    res.status(200).json({
        msg: mensaje,
        resultados
    });
};