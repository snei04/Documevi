const pool = require('../config/db');

// Obtener todas las oficinas
exports.getAllOficinas = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT op.*, d.nombre_dependencia 
            FROM oficinas_productoras op
            LEFT JOIN dependencias d ON op.id_dependencia = d.id
            ORDER BY op.activo DESC, op.nombre_oficina ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Crear una nueva oficina
exports.createOficina = async (req, res) => {
  const { id_dependencia, codigo_oficina, nombre_oficina } = req.body;

  if (!id_dependencia || !codigo_oficina || !nombre_oficina) {
    return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO oficinas_productoras (id_dependencia, codigo_oficina, nombre_oficina) VALUES (?, ?, ?)',
      [id_dependencia, codigo_oficina, nombre_oficina]
    );
    res.status(201).json({
      id: result.insertId,
      id_dependencia,
      codigo_oficina,
      nombre_oficina
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la oficina ya existe.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

exports.updateOficina = async (req, res) => {
    const { id } = req.params;
    const { nombre_oficina, codigo_oficina, id_dependencia } = req.body;

    if (!nombre_oficina || !codigo_oficina || !id_dependencia) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE oficinas_productoras SET nombre_oficina = ?, codigo_oficina = ?, id_dependencia = ? WHERE id = ?',
            [nombre_oficina, codigo_oficina, id_dependencia, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Oficina no encontrada.' });
        }
        res.json({ msg: 'Oficina actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Activa o desactiva una oficina
exports.toggleOficinaStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE oficinas_productoras SET activo = NOT activo WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Oficina no encontrada.' });
        }
        res.json({ msg: 'Estado de la oficina actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Carga masiva de oficinas desde Excel
exports.bulkCreateOficinas = async (req, res) => {
    const { oficinas } = req.body;

    if (!oficinas || !Array.isArray(oficinas) || oficinas.length === 0) {
        return res.status(400).json({ msg: 'Debe proporcionar un array de oficinas.' });
    }

    // Obtener todas las dependencias para mapear código -> id
    const [dependenciasRows] = await pool.query('SELECT id, codigo_dependencia FROM dependencias WHERE activo = 1');
    const dependenciasMap = {};
    dependenciasRows.forEach(dep => {
        dependenciasMap[String(dep.codigo_dependencia).trim()] = dep.id;
    });

    const resultados = {
        creadas: 0,
        errores: [],
        duplicados: []
    };

    for (let i = 0; i < oficinas.length; i++) {
        const ofi = oficinas[i];
        const fila = i + 2; // +2 porque Excel empieza en 1 y la fila 1 es el encabezado

        // Validar campos obligatorios
        if (!ofi.codigo_dependencia || !ofi.codigo_oficina || !ofi.nombre_oficina) {
            resultados.errores.push({
                fila,
                mensaje: 'Código dependencia, código oficina y nombre son obligatorios',
                datos: ofi
            });
            continue;
        }

        // Buscar el id de la dependencia por su código
        const idDependencia = dependenciasMap[String(ofi.codigo_dependencia).trim()];
        if (!idDependencia) {
            resultados.errores.push({
                fila,
                mensaje: `Dependencia con código "${ofi.codigo_dependencia}" no encontrada`,
                datos: ofi
            });
            continue;
        }

        try {
            await pool.query(
                'INSERT INTO oficinas_productoras (id_dependencia, codigo_oficina, nombre_oficina) VALUES (?, ?, ?)',
                [idDependencia, String(ofi.codigo_oficina).trim(), String(ofi.nombre_oficina).trim()]
            );
            resultados.creadas++;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                resultados.duplicados.push({
                    fila,
                    codigo_oficina: ofi.codigo_oficina,
                    nombre_oficina: ofi.nombre_oficina
                });
            } else {
                resultados.errores.push({
                    fila,
                    mensaje: error.message,
                    datos: ofi
                });
            }
        }
    }

    const mensaje = `Carga completada: ${resultados.creadas} oficinas creadas, ${resultados.duplicados.length} duplicados, ${resultados.errores.length} errores.`;
    
    res.status(200).json({
        msg: mensaje,
        resultados
    });
};