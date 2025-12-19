const pool = require('../config/db');

// Obtener todas las dependencias
exports.getAllDependencias = async (req, res) => {
    try {
        // La consulta ahora trae todas las dependencias pero las ordena por estado y nombre
        const [rows] = await pool.query('SELECT * FROM dependencias ORDER BY activo DESC, nombre_dependencia ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Crear una nueva dependencia
exports.createDependencia = async (req, res) => {
  const { codigo_dependencia, nombre_dependencia } = req.body;

  if (!codigo_dependencia || !nombre_dependencia) {
    return res.status(400).json({ msg: 'El código y el nombre son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO dependencias (codigo_dependencia, nombre_dependencia) VALUES (?, ?)',
      [codigo_dependencia, nombre_dependencia]
    );
    res.status(201).json({
      id: result.insertId,
      codigo_dependencia,
      nombre_dependencia
    });
  } catch (error) {
    // Manejar error de código duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la dependencia ya existe.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Función para editar una dependencia
exports.updateDependencia = async (req, res) => {
    const { id } = req.params;
    const { nombre_dependencia, codigo_dependencia } = req.body;

    if (!nombre_dependencia || !codigo_dependencia) {
        return res.status(400).json({ msg: 'El nombre y el código son obligatorios.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE dependencias SET nombre_dependencia = ?, codigo_dependencia = ? WHERE id = ?',
            [nombre_dependencia, codigo_dependencia, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Dependencia no encontrada.' });
        }
        res.json({ msg: 'Dependencia actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Función para activar/desactivar una dependencia
exports.toggleDependenciaStatus = async (req, res) => {
    const { id } = req.params;
    try {
      // Cambia el estado de activo a inactivo o viceversa
      const [result] = await pool.query(
        'UPDATE dependencias SET activo = NOT activo WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: 'Dependencia no encontrada.' });
      }
      res.json({ msg: 'Estado de la dependencia actualizado con éxito.' });
    } catch (error) {
      res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Carga masiva de dependencias desde Excel
exports.bulkCreateDependencias = async (req, res) => {
    const { dependencias } = req.body;

    if (!dependencias || !Array.isArray(dependencias) || dependencias.length === 0) {
        return res.status(400).json({ msg: 'Debe proporcionar un array de dependencias.' });
    }

    const resultados = {
        creadas: 0,
        errores: [],
        duplicados: []
    };

    for (let i = 0; i < dependencias.length; i++) {
        const dep = dependencias[i];
        const fila = i + 2; // +2 porque Excel empieza en 1 y la fila 1 es el encabezado

        // Validar que tenga código y nombre
        if (!dep.codigo || !dep.nombre) {
            resultados.errores.push({
                fila,
                mensaje: 'Código y nombre son obligatorios',
                datos: dep
            });
            continue;
        }

        try {
            await pool.query(
                'INSERT INTO dependencias (codigo_dependencia, nombre_dependencia) VALUES (?, ?)',
                [String(dep.codigo).trim(), String(dep.nombre).trim()]
            );
            resultados.creadas++;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                resultados.duplicados.push({
                    fila,
                    codigo: dep.codigo,
                    nombre: dep.nombre
                });
            } else {
                resultados.errores.push({
                    fila,
                    mensaje: error.message,
                    datos: dep
                });
            }
        }
    }

    const mensaje = `Carga completada: ${resultados.creadas} dependencias creadas, ${resultados.duplicados.length} duplicados, ${resultados.errores.length} errores.`;
    
    res.status(200).json({
        msg: mensaje,
        resultados
    });
};