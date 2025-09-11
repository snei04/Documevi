const pool = require('../config/db');
const { generarRadicado } = require('../utils/radicado.util');
// ✅ LÍNEA CORREGIDA
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs/promises');
const path = require('path');

// Obtener todos los expedientes
exports.getAllExpedientes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.*, 
        s.nombre_serie, 
        ss.nombre_subserie,
        u.nombre_completo as nombre_responsable
      FROM expedientes e
      LEFT JOIN trd_series s ON e.id_serie = s.id
      LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
      LEFT JOIN usuarios u ON e.id_usuario_responsable = u.id
      ORDER BY e.fecha_apertura DESC
    `);
    res.json(rows);
  } catch (error) {
    // Si aún hay un error, este log es vital
    console.error("Error en getAllExpedientes:", error); 
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo expediente
exports.createExpediente = async (req, res) => {
  const {
    nombre_expediente,
    id_serie,
    id_subserie,
    descriptor_1,
    descriptor_2
  } = req.body;
  const id_usuario_responsable = req.user.id;

  if (!nombre_expediente || !id_serie || !id_subserie) {
    return res.status(400).json({ msg: 'Nombre, serie y subserie son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO expedientes (nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable]
    );
    res.status(201).json({
      id: result.insertId,
      ...req.body,
      id_usuario_responsable
    });
  } catch (error) {
    console.error("Error al crear expediente:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

exports.getExpedienteById = async (req, res) => {
  const { id: id_expediente } = req.params;
  const id_usuario_actual = req.user.id;
  const permisos_usuario = req.user.permissions || [];

  try {
    const [expedientes] = await pool.query("SELECT * FROM expedientes WHERE id = ?", [id_expediente]);
    if (expedientes.length === 0) {
      return res.status(404).json({ msg: 'Expediente no encontrado.' });
    }
    const expediente = expedientes[0];
    const esProductor = expediente.id_usuario_responsable === id_usuario_actual;
    const tienePermisoEspecial = permisos_usuario.includes('ver_expedientes_cerrados');
    
    // ✅ Definimos la consulta en una variable para poder limpiarla
    const sqlDocumentos = `
      SELECT d.*, ed.orden_foliado, ed.fecha_incorporacion, ed.requiere_firma
      FROM expediente_documentos ed
      LEFT JOIN documentos d ON ed.id_documento = d.id 
      WHERE ed.id_expediente = ? 
      ORDER BY ed.orden_foliado ASC
    `;

    if (esProductor || tienePermisoEspecial) {
        // ✅ Usamos .trim() para eliminar espacios o caracteres invisibles
        const [documentos] = await pool.query(sqlDocumentos.trim(), [id_expediente]);
        const vista = esProductor ? 'productor' : 'auditor';
        return res.json({ ...expediente, documentos: documentos, vista: vista });
    }

    const [prestamos] = await pool.query(
      "SELECT * FROM prestamos WHERE id_expediente = ? AND id_usuario_solicitante = ? AND estado = 'Prestado' AND fecha_devolucion_prevista >= CURDATE()",
      [id_expediente, id_usuario_actual]
    );

    if (prestamos.length > 0) {
        // ✅ Reutilizamos la misma consulta limpia aquí
        const [documentos] = await pool.query(sqlDocumentos.trim(), [id_expediente]);
        res.json({ ...expediente, documentos: documentos, vista: 'solicitante_prestamo' });
    } else {
      res.json({
        nombre_expediente: expediente.nombre_expediente,
        fecha_apertura: expediente.fecha_apertura,
        estado: expediente.estado,
        vista: 'solicitante_restringido'
      });
    }
  } catch (error) {
    console.error("Error al obtener el expediente:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Añadir un documento a un expediente (Índice Electrónico)
exports.addDocumentoToExpediente = async (req, res) => {
  const { id_expediente } = req.params;
  const { id_documento, requiere_firma } = req.body;

  if (!id_documento) {
    return res.status(400).json({ msg: 'El ID del documento es obligatorio.' });
  }

  try {
    const [folioRows] = await pool.query(
      'SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?',
      [id_expediente]
    );
    const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

    const [result] = await pool.query(
      'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma) VALUES (?, ?, ?, ?)',
      [id_expediente, id_documento, nuevoFolio, requiere_firma || false]
    );

    res.status(201).json({ 
      id: result.insertId,
      id_expediente,
      id_documento,
      orden_foliado: nuevoFolio,
      requiere_firma
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Este documento ya existe en el expediente.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Cerrar un expediente
exports.closeExpediente = async (req, res) => {
  const { id } = req.params;
  const id_usuario_accion = req.user.id;

  try {
    const [expedientes] = await pool.query("SELECT estado FROM expedientes WHERE id = ?", [id]);

    if (expedientes.length === 0) {
      return res.status(404).json({ msg: 'Expediente no encontrado.' });
    }
    if (expedientes[0].estado !== 'En trámite') {
      return res.status(400).json({ msg: 'Solo se pueden cerrar expedientes que están "En trámite".' });
    }

    await pool.query(
      "UPDATE expedientes SET estado = 'Cerrado en Gestión', fecha_cierre = NOW() WHERE id = ?",
      [id]
    );

    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [id_usuario_accion, 'CIERRE_EXPEDIENTE', `El usuario cerró el expediente con ID ${id}`]
    );

    res.json({ msg: 'Expediente cerrado con éxito.' });

  } catch (error) {
    console.error("Error al cerrar el expediente:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

exports.getExpedienteCustomData = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id_campo, valor FROM expediente_datos_personalizados WHERE id_expediente = ?',
      [id]
    );

    const data = rows.reduce((acc, row) => {
      acc[row.id_campo] = row.valor;
      return acc;
    }, {});

    res.json(data);

  } catch (error) {
    console.error("Error al obtener datos personalizados:", error); 
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Guardar o actualizar los datos personalizados de un expediente
exports.updateExpedienteCustomData = async (req, res) => {
  const { id: id_expediente } = req.params;
  const customData = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM expediente_datos_personalizados WHERE id_expediente = ?', [id_expediente]);

    const values = Object.entries(customData).map(([id_campo, valor]) => [id_expediente, id_campo, valor]);
    if (values.length > 0) {
      await connection.query('INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES ?', [values]);
    }

    await connection.commit();
    res.json({ msg: 'Datos personalizados guardados con éxito.' });
  } catch (error) {
    await connection.rollback();
    console.error("Error al guardar datos personalizados:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

exports.createDocumentoFromPlantilla = async (req, res) => {
    const { id: id_expediente } = req.params;
    const { id_plantilla, datos_rellenados, id_serie, id_subserie, id_oficina_productora } = req.body;
    const id_usuario_radicador = req.user.id;

    if (!id_plantilla || !datos_rellenados || !id_serie || !id_subserie) {
        return res.status(400).json({ msg: 'Faltan datos para generar el documento.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [plantillaRows] = await connection.query('SELECT nombre, diseño_json FROM plantillas WHERE id = ?', [id_plantilla]);

        if (plantillaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }

        const nombrePlantilla = plantillaRows[0].nombre;
        const diseño = JSON.parse(plantillaRows[0].diseño_json || '{}');

        const asunto = `${nombrePlantilla} - Creado desde plantilla`;
        const radicado = await generarRadicado();
        
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();

        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontMap = {
            'Helvetica': helveticaFont,
            'Helvetica-Bold': helveticaBoldFont,
        };
        
        if (diseño.titulo) {
            page.drawText(diseño.titulo.texto, {
                x: diseño.titulo.x,
                y: diseño.titulo.y,
                size: diseño.titulo.fontSize,
                font: fontMap[diseño.titulo.font] || helveticaBoldFont,
                color: rgb(0, 0, 0),
            });
        }
        
        if (diseño.placeholders) {
            for (const placeholder of diseño.placeholders) {
                const valor = datos_rellenados[placeholder.campo];
                
                if (valor) {
                    page.drawText(String(valor), {
                        x: placeholder.x,
                        y: placeholder.y,
                        size: placeholder.fontSize,
                        font: fontMap[placeholder.font] || helveticaFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        
        const fileName = `${radicado}.pdf`;
        const filePath = path.join('uploads', fileName);
        await fs.writeFile(filePath, pdfBytes);

        const [docResult] = await connection.query(
            `INSERT INTO documentos (radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, id_usuario_radicador, path_archivo, nombre_archivo_original)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [radicado, asunto, id_oficina_productora, id_serie, id_subserie, 'Generado Internamente', id_usuario_radicador, filePath, fileName]
        );
        const newDocumentId = docResult.insertId;

        const [folioRows] = await connection.query('SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?', [id_expediente]);
        const nuevoFolio = (folioRows[0].max_folio || 0) + 1;
        await connection.query(
            'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado) VALUES (?, ?, ?)',
            [id_expediente, newDocumentId, nuevoFolio]
        );
        
        await connection.commit();
        res.status(201).json({ msg: 'Documento PDF generado desde plantilla y añadido al expediente con éxito.' });

    } catch (error) {
        await connection.rollback();
        console.error("Error al generar documento desde plantilla:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        connection.release();
    }
};