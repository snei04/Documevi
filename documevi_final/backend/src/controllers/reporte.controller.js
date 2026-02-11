const pool = require('../config/db');

/**
 * Genera el reporte FUID (Formato Único de Inventario Documental) optimizado
 */
exports.generateFUID = async (req, res) => {
  const { oficinaId, serieId, fechaInicio, fechaFin, page, limit } = req.query;

  if (!oficinaId) {
    return res.status(400).json({ msg: 'El ID de la oficina es obligatorio.' });
  }

  // Paginación
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const offset = (pageNum - 1) * limitNum;

  // Construcción dinámica de filtros
  const params = [oficinaId];
  let filterConditions = "";

  if (serieId) {
    filterConditions += " AND ser.id = ? ";
    params.push(serieId);
  }

  if (fechaInicio) {
    filterConditions += " AND exp.fecha_apertura >= ? ";
    params.push(fechaInicio);
  }

  if (fechaFin) {
    filterConditions += " AND exp.fecha_apertura <= ? ";
    params.push(fechaFin);
  }

  try {
    // 1. Obtener total de registros para paginación
    const [countRow] = await pool.query(`
            SELECT COUNT(DISTINCT exp.id) as total
            FROM expedientes exp
            JOIN trd_series ser ON exp.id_serie = ser.id
            JOIN oficinas_productoras ofi ON ser.id_oficina_productora = ofi.id
            WHERE ofi.id = ? ${filterConditions}
        `, params);

    const total = countRow[0].total;
    const totalPages = Math.ceil(total / limitNum);

    // 2. Consulta principal paginada
    const [rows] = await pool.query(`
          SELECT
            exp.id,
            exp.id as numero_orden,
            exp.nombre_expediente,
            exp.fecha_apertura,
            exp.fecha_cierre,
            dep.nombre_dependencia,
            ofi.nombre_oficina,
            ser.codigo_serie,
            ser.nombre_serie,
            sub.codigo_subserie,
            sub.nombre_subserie,
            
            COALESCE(exp.fase_retencion, 'Vigente') as fase_retencion,
            exp.fecha_fin_gestion,
            exp.fecha_fin_central,
            COALESCE(sub.disposicion_final, ser.disposicion_final) as disposicion_final,
            
            c.codigo_carpeta,
            p.numero_paquete,
            
            COUNT(doc.id) as numero_folios,
            
            'Electrónico' as soporte, 
            
            (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT('nombre', ocp.nombre_campo, 'valor', edp.valor)
              )
              FROM expediente_datos_personalizados edp
              JOIN oficina_campos_personalizados ocp ON edp.id_campo = ocp.id
              WHERE edp.id_expediente = exp.id
            ) as metadatos_personalizados

          FROM expedientes exp
          JOIN trd_series ser ON exp.id_serie = ser.id
          LEFT JOIN trd_subseries sub ON exp.id_subserie = sub.id
          JOIN oficinas_productoras ofi ON ser.id_oficina_productora = ofi.id
          JOIN dependencias dep ON ofi.id_dependencia = dep.id
          
          LEFT JOIN carpetas c ON c.id_expediente = exp.id
          LEFT JOIN paquetes p ON exp.id_paquete = p.id
          
          LEFT JOIN expediente_documentos edoc ON edoc.id_expediente = exp.id
          LEFT JOIN documentos doc ON edoc.id_documento = doc.id
          
          WHERE ofi.id = ? ${filterConditions}
          GROUP BY exp.id
          ORDER BY ser.codigo_serie, sub.codigo_subserie, exp.fecha_apertura
          LIMIT ? OFFSET ?;
        `, [...params, limitNum, offset]);

    // Procesamiento ligero en JS
    const processedRows = rows.map(row => {
      const ubicacionParts = [];
      if (row.numero_paquete) ubicacionParts.push(`Paquete ${row.numero_paquete}`);
      if (row.codigo_carpeta) ubicacionParts.push(`Carpeta ${row.codigo_carpeta}`);
      const ubicacion_fisica = ubicacionParts.join(' / ') || 'Sin ubicación física';

      let info_retencion = row.fase_retencion;
      if (row.fecha_fin_gestion) {
        const fecha = new Date(row.fecha_fin_gestion).toLocaleDateString('es-CO');
        info_retencion += ` (Gestión hasta: ${fecha})`;
      } else if (row.fecha_fin_central) {
        const fecha = new Date(row.fecha_fin_central).toLocaleDateString('es-CO');
        info_retencion += ` (Central hasta: ${fecha})`;
      }

      return {
        ...row,
        ubicacion_fisica,
        info_retencion
      };
    });

    res.json({
      data: processedRows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });

  } catch (error) {
    console.error("Error al generar el reporte FUID:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

/**
 * Obtiene la trazabilidad (timeline) de un expediente
 */
exports.getTrazabilidadExpediente = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
            SELECT 
                a.fecha,
                a.accion,
                a.detalles,
                u.nombre_completo as usuario,
                r.nombre as rol
            FROM auditoria a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE (
                a.detalles LIKE CONCAT('%Expediente ', ?, '%') 
                OR a.detalles LIKE CONCAT('%Expediente con ID ', ?, '%')
            )
            ORDER BY a.fecha DESC
        `, [id, id]);

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener trazabilidad:", error);
    res.status(500).json({ msg: 'Error al obtener trazabilidad', error: error.message });
  }
};