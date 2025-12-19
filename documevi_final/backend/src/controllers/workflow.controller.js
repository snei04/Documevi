/**
 * @fileoverview Controlador de workflows para el sistema Documevi.
 * Gestiona la creación y configuración de flujos de trabajo (workflows),
 * sus pasos y las tareas asignadas a los usuarios según su rol.
 * 
 * @module controllers/workflow
 */

const pool = require('../config/db');


// ============================================
// GESTIÓN DE WORKFLOWS
// ============================================

/**
 * Obtiene la lista de todos los workflows del sistema.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Array} JSON con lista de workflows ordenados por nombre
 */
exports.getAllWorkflows = async (req, res) => {
  try {
    // Obtener todos los workflows ordenados alfabéticamente
    const [rows] = await pool.query('SELECT * FROM workflows ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

/**
 * Crea un nuevo workflow en el sistema.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Datos del workflow
 * @param {string} req.body.nombre - Nombre del workflow (obligatorio, único)
 * @param {string} [req.body.descripcion] - Descripción del workflow
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con el workflow creado (id, nombre, descripcion)
 */
exports.createWorkflow = async (req, res) => {
  const { nombre, descripcion } = req.body;

  // Validar campo obligatorio
  if (!nombre) {
    return res.status(400).json({ msg: 'El nombre del workflow es obligatorio.' });
  }

  try {
    // Insertar el nuevo workflow
    const [result] = await pool.query(
      'INSERT INTO workflows (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );
    
    // Retornar el workflow creado con su ID
    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion
    });
  } catch (error) {
    // Manejar error de nombre duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Ya existe un workflow con ese nombre.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
  
};

/**
 * Obtiene un workflow específico por su ID.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del workflow
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con los datos del workflow
 */
exports.getWorkflowById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM workflows WHERE id = ?', [id]);
    
    // Verificar que el workflow existe
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Workflow no encontrado.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};


// ============================================
// GESTIÓN DE PASOS DE WORKFLOW
// ============================================

/**
 * Obtiene todos los pasos de un workflow específico.
 * Incluye el nombre del rol responsable de cada paso.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del workflow
 * @param {Object} res - Response de Express
 * @returns {Array} JSON con lista de pasos ordenados por número de orden
 */
exports.getWorkflowPasos = async (req, res) => {
  const { id } = req.params;
  try {
    // Consulta con JOIN para incluir el nombre del rol responsable
    const [rows] = await pool.query(
      'SELECT wp.*, r.nombre as nombre_rol FROM workflow_pasos wp JOIN roles r ON wp.id_rol_responsable = r.id WHERE id_workflow = ? ORDER BY orden ASC', 
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

/**
 * Crea un nuevo paso dentro de un workflow.
 * Cada paso define una etapa del flujo con un rol responsable.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.id - ID del workflow padre
 * @param {Object} req.body - Datos del paso
 * @param {string} req.body.nombre_paso - Nombre descriptivo del paso
 * @param {number} req.body.orden - Número de orden del paso (único por workflow)
 * @param {number} req.body.id_rol_responsable - ID del rol que ejecutará este paso
 * @param {boolean} [req.body.requiere_firma] - Si el paso requiere firma digital (default: false)
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con el paso creado
 */
exports.createWorkflowPaso = async (req, res) => {
  // Extraer ID del workflow de los parámetros de URL
  const { id: id_workflow } = req.params;
  const { nombre_paso, orden, id_rol_responsable, requiere_firma } = req.body; 

  // Validar campos obligatorios
  if (!nombre_paso || !orden || !id_rol_responsable) {
    return res.status(400).json({ msg: 'Nombre, orden y rol son obligatorios.' });
  }

  try {
    // Insertar el nuevo paso con requiere_firma por defecto en false
    const [result] = await pool.query(
      'INSERT INTO workflow_pasos (id_workflow, nombre_paso, orden, id_rol_responsable, requiere_firma) VALUES (?, ?, ?, ?, ?)',
      [id_workflow, nombre_paso, orden, id_rol_responsable, requiere_firma || false]
    );
    
    // Retornar el paso creado
    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    // Manejar error de orden duplicado dentro del mismo workflow
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El número de orden ya existe para este workflow.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};


// ============================================
// TAREAS DEL USUARIO (BANDEJA DE ENTRADA)
// ============================================

/**
 * Obtiene las tareas pendientes asignadas al usuario según su rol.
 * Muestra documentos que están en un paso del workflow donde el rol
 * del usuario es el responsable y el estado es "En Progreso".
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.user - Usuario autenticado (del middleware)
 * @param {number} req.user.rol_id - ID del rol del usuario
 * @param {Object} res - Response de Express
 * @returns {Array} JSON con lista de tareas pendientes del usuario
 * 
 * @example
 * // Response
 * [{
 *   id_seguimiento: 1,
 *   id_documento: 5,
 *   radicado: "2024-001",
 *   asunto: "Solicitud de...",
 *   path_archivo: "/uploads/doc.pdf",
 *   nombre_workflow: "Aprobación de documentos",
 *   paso_actual: "Revisión inicial",
 *   requiere_firma: true
 * }]
 */
exports.getMyTasks = async (req, res) => {
  // Obtener el rol del usuario autenticado
  const userRoleId = req.user.rol_id;

  try {
    // Consulta que une documento_workflows, documentos, workflows y workflow_pasos
    // Filtra por rol responsable del paso actual y estado "En Progreso"
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