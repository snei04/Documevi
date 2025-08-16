// Archivo: backend/src/controllers/workflow.controller.js
const pool = require('../config/db');



// Obtener todos los workflows
exports.getAllWorkflows = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workflows ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo workflow
exports.createWorkflow = async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({ msg: 'El nombre del workflow es obligatorio.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO workflows (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );
    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Ya existe un workflow con ese nombre.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
  
};

exports.getWorkflowPasos = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT wp.*, r.nombre as nombre_rol FROM workflow_pasos wp JOIN roles r ON wp.id_rol_responsable = r.id WHERE id_workflow = ? ORDER BY orden ASC', 
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo paso en un workflow
exports.createWorkflowPaso = async (req, res) => {
  const { id: id_workflow } = req.params;
  const { nombre_paso, orden, id_rol_responsable, requiere_firma } = req.body; 

  if (!nombre_paso || !orden || !id_rol_responsable) {
    return res.status(400).json({ msg: 'Nombre, orden y rol son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO workflow_pasos (id_workflow, nombre_paso, orden, id_rol_responsable, requiere_firma) VALUES (?, ?, ?, ?, ?)',
      [id_workflow, nombre_paso, orden, id_rol_responsable, requiere_firma || false]
    );
    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El número de orden ya existe para este workflow.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Obtener un workflow por su ID
exports.getWorkflowById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM workflows WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Workflow no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

exports.getMyTasks = async (req, res) => {
  const userRoleId = req.user.rol;

  try {
    const [tasks] = await pool.query(`
      SELECT 
        dw.id as id_seguimiento,
        d.id as id_documento,
        d.radicado,
        d.asunto,
        d.path_archivo,
        w.nombre as nombre_workflow,
        wp.nombre_paso as paso_actual,
        wp.requiere_firma
      FROM documento_workflows dw
      JOIN documentos d ON dw.id_documento = d.id
      JOIN workflows w ON dw.id_workflow = w.id
      JOIN workflow_pasos wp ON dw.id_paso_actual = wp.id
      WHERE wp.id_rol_responsable = ? AND dw.estado = 'En Progreso'
    `, [userRoleId]);

    res.json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};