const pool = require('../config/db');

// Obtiene todas las series y las ordena por estado
exports.getAllSeries = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, o.nombre_oficina 
            FROM trd_series s
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            ORDER BY s.activo DESC, s.nombre_serie ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Crea una nueva serie
exports.createSerie = async (req, res) => {
    // Añadimos 'requiere_subserie'
    const { nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie } = req.body;
    
    if (!nombre_serie || !codigo_serie || !id_oficina_productora) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            // Añadimos la nueva columna a la consulta
            'INSERT INTO trd_series (nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie) VALUES (?, ?, ?, ?)',
            [nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Edita una serie existente
exports.updateSerie = async (req, res) => {
    const { id } = req.params;
    const { 
        nombre_serie, 
        codigo_serie, 
        id_oficina_productora, 
        requiere_subserie,
        retencion_gestion,
        retencion_central,
        disposicion_final
    } = req.body;

    if (!nombre_serie || !codigo_serie || !id_oficina_productora) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    }
    
    // Convertir valores vacíos a null para campos numéricos
    const retGestion = retencion_gestion === '' || retencion_gestion === undefined ? null : retencion_gestion;
    const retCentral = retencion_central === '' || retencion_central === undefined ? null : retencion_central;
    const dispFinal = disposicion_final || null;
    
    try {
        const [result] = await pool.query(
            `UPDATE trd_series SET 
                nombre_serie = ?, 
                codigo_serie = ?, 
                id_oficina_productora = ?, 
                requiere_subserie = ?,
                retencion_gestion = ?,
                retencion_central = ?,
                disposicion_final = ?
            WHERE id = ?`,
            [nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie, retGestion, retCentral, dispFinal, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Serie no encontrada.' });
        }
        res.json({ msg: 'Serie actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Activa o desactiva una serie
exports.toggleSerieStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE trd_series SET activo = NOT activo WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Serie no encontrada.' });
        }
        res.json({ msg: 'Estado de la serie actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Carga masiva de series desde Excel
exports.bulkCreateSeries = async (req, res) => {
    const { series } = req.body;

    if (!series || !Array.isArray(series) || series.length === 0) {
        return res.status(400).json({ msg: 'Debe proporcionar un array de series.' });
    }

    // Obtener todas las oficinas para mapear código -> id
    const [oficinasRows] = await pool.query('SELECT id, codigo_oficina FROM oficinas_productoras WHERE activo = 1');
    const oficinasMap = {};
    oficinasRows.forEach(ofi => {
        oficinasMap[String(ofi.codigo_oficina).trim()] = ofi.id;
    });

    const resultados = {
        creadas: 0,
        errores: [],
        duplicados: []
    };

    for (let i = 0; i < series.length; i++) {
        const serie = series[i];
        const fila = i + 2;

        // Validar campos obligatorios
        if (!serie.codigo_oficina || !serie.codigo_serie || !serie.nombre_serie) {
            resultados.errores.push({
                fila,
                mensaje: 'Código oficina, código serie y nombre son obligatorios',
                datos: serie
            });
            continue;
        }

        // Buscar el id de la oficina por su código
        const idOficina = oficinasMap[String(serie.codigo_oficina).trim()];
        if (!idOficina) {
            resultados.errores.push({
                fila,
                mensaje: `Oficina con código "${serie.codigo_oficina}" no encontrada`,
                datos: serie
            });
            continue;
        }

        // Determinar si requiere subserie (por defecto true, a menos que se especifique "No" o "0" o "false")
        let requiereSubserie = true;
        if (serie.requiere_subserie !== undefined && serie.requiere_subserie !== null) {
            const val = String(serie.requiere_subserie).toLowerCase().trim();
            requiereSubserie = !(val === 'no' || val === '0' || val === 'false' || val === 'n');
        }

        // Campos de retención (solo aplican si no requiere subserie)
        const retencionGestion = !requiereSubserie && serie.retencion_gestion ? serie.retencion_gestion : null;
        const retencionCentral = !requiereSubserie && serie.retencion_central ? serie.retencion_central : null;
        const disposicionFinal = !requiereSubserie && serie.disposicion_final ? serie.disposicion_final : null;

        try {
            await pool.query(
                `INSERT INTO trd_series (id_oficina_productora, codigo_serie, nombre_serie, requiere_subserie, retencion_gestion, retencion_central, disposicion_final) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idOficina, String(serie.codigo_serie).trim(), String(serie.nombre_serie).trim(), requiereSubserie, retencionGestion, retencionCentral, disposicionFinal]
            );
            resultados.creadas++;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                resultados.duplicados.push({
                    fila,
                    codigo_serie: serie.codigo_serie,
                    nombre_serie: serie.nombre_serie
                });
            } else {
                resultados.errores.push({
                    fila,
                    mensaje: error.message,
                    datos: serie
                });
            }
        }
    }

    const mensaje = `Carga completada: ${resultados.creadas} series creadas, ${resultados.duplicados.length} duplicados, ${resultados.errores.length} errores.`;
    
    res.status(200).json({
        msg: mensaje,
        resultados
    });
};