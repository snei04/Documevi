const pool = require('../config/db');

// Búsqueda global en documentos y expedientes
exports.search = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ msg: 'El término de búsqueda es obligatorio.' });
  }

  try {
    const searchTerm = `%${q}%`;

    // Búsqueda en documentos incluyendo campos personalizados
    const [documentosResults] = await pool.query(`
      SELECT DISTINCT d.id, d.radicado, d.asunto 
      FROM documentos d
      LEFT JOIN documento_datos_personalizados ddp ON d.id = ddp.id_documento
      WHERE d.asunto LIKE ? 
         OR d.contenido_extraido LIKE ?
         OR d.radicado LIKE ?
         OR d.remitente_nombre LIKE ?
         OR ddp.valor LIKE ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    // Búsqueda en expedientes incluyendo campos personalizados
    const [expedientesResults] = await pool.query(`
      SELECT DISTINCT e.id, e.nombre_expediente, e.estado
      FROM expedientes e
      LEFT JOIN expediente_datos_personalizados edp ON e.id = edp.id_expediente
      WHERE e.nombre_expediente LIKE ?
         OR e.descriptor_1 LIKE ?
         OR e.descriptor_2 LIKE ?
         OR edp.valor LIKE ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json({
      documentos: documentosResults,
      expedientes: expedientesResults
    });

  } catch (error) {
    console.error("Error en la búsqueda:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Búsqueda avanzada con filtros específicos
exports.advancedSearch = async (req, res) => {
  const { 
    termino, 
    fecha_desde, 
    fecha_hasta, 
    id_serie, 
    id_subserie,
    id_oficina,
    tipo_soporte,
    campo_personalizado_id,
    campo_personalizado_valor
  } = req.query;

  try {
    let query = `
      SELECT DISTINCT 
        d.id, 
        d.radicado, 
        d.asunto, 
        d.fecha_radicado,
        d.tipo_soporte,
        s.nombre_serie,
        ss.nombre_subserie,
        o.nombre_oficina
      FROM documentos d
      LEFT JOIN trd_series s ON d.id_serie = s.id
      LEFT JOIN trd_subseries ss ON d.id_subserie = ss.id
      LEFT JOIN oficinas_productoras o ON d.id_oficina_productora = o.id
      LEFT JOIN documento_datos_personalizados ddp ON d.id = ddp.id_documento
      WHERE 1=1
    `;
    const params = [];

    // Filtro por término general
    if (termino) {
      query += ` AND (d.asunto LIKE ? OR d.contenido_extraido LIKE ? OR d.radicado LIKE ? OR d.remitente_nombre LIKE ? OR ddp.valor LIKE ?)`;
      const searchTerm = `%${termino}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro por rango de fechas
    if (fecha_desde) {
      query += ` AND d.fecha_radicado >= ?`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      query += ` AND d.fecha_radicado <= ?`;
      params.push(fecha_hasta + ' 23:59:59');
    }

    // Filtro por serie
    if (id_serie) {
      query += ` AND d.id_serie = ?`;
      params.push(id_serie);
    }

    // Filtro por subserie
    if (id_subserie) {
      query += ` AND d.id_subserie = ?`;
      params.push(id_subserie);
    }

    // Filtro por oficina
    if (id_oficina) {
      query += ` AND d.id_oficina_productora = ?`;
      params.push(id_oficina);
    }

    // Filtro por tipo de soporte
    if (tipo_soporte) {
      query += ` AND d.tipo_soporte = ?`;
      params.push(tipo_soporte);
    }

    // Filtro por campo personalizado específico
    if (campo_personalizado_id && campo_personalizado_valor) {
      query += ` AND EXISTS (
        SELECT 1 FROM documento_datos_personalizados ddp2 
        WHERE ddp2.id_documento = d.id 
        AND ddp2.id_campo = ? 
        AND ddp2.valor LIKE ?
      )`;
      params.push(campo_personalizado_id, `%${campo_personalizado_valor}%`);
    }

    query += ` ORDER BY d.fecha_radicado DESC LIMIT 100`;

    const [results] = await pool.query(query, params);

    res.json(results);

  } catch (error) {
    console.error("Error en la búsqueda avanzada:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Obtener campos personalizados para búsqueda
exports.getSearchableCustomFields = async (req, res) => {
  try {
    const [fields] = await pool.query(`
      SELECT DISTINCT cp.id, cp.nombre_campo, cp.tipo_campo, o.nombre_oficina
      FROM oficina_campos_personalizados cp
      JOIN oficinas_productoras o ON cp.id_oficina = o.id
      ORDER BY o.nombre_oficina, cp.nombre_campo
    `);
    res.json(fields);
  } catch (error) {
    console.error("Error al obtener campos personalizados:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};