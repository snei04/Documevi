/**
 * @fileoverview Controlador de transferencias documentales para el sistema Documevi.
 * Gestiona la transferencia primaria de expedientes desde el Archivo de Gestión
 * hacia el Archivo Central, siguiendo las normas archivísticas.
 * 
 * @module controllers/transferencia
 */

const pool = require('../config/db');

/**
 * Realiza la transferencia primaria de expedientes al Archivo Central.
 * Cambia el estado de los expedientes de "Cerrado en Gestión" a "Cerrado en Central".
 * Solo se pueden transferir expedientes que estén cerrados en el archivo de gestión.
 * 
 * @async
 * @param {Object} req - Request de Express
 * @param {Object} req.body - Cuerpo de la petición
 * @param {Array<number>} req.body.expedientesIds - Array de IDs de expedientes a transferir
 * @param {Object} req.user - Usuario autenticado (del middleware de auth)
 * @param {number} req.user.id - ID del usuario que realiza la transferencia
 * @param {Object} res - Response de Express
 * @returns {Object} JSON con mensaje de éxito indicando cantidad transferida, o error
 * 
 * @example
 * // Request body
 * { "expedientesIds": [1, 2, 3, 4, 5] }
 * 
 * // Response exitosa
 * { "msg": "5 expedientes han sido transferidos con éxito." }
 */
exports.realizarTransferencia = async (req, res) => {
  // Extraer array de IDs de expedientes del cuerpo de la petición
  const { expedientesIds } = req.body;
  // Obtener ID del usuario que realiza la acción (para auditoría)
  const id_usuario_accion = req.user.id;

  // Validar que se recibió un array válido con al menos un ID
  if (!expedientesIds || !Array.isArray(expedientesIds) || expedientesIds.length === 0) {
    return res.status(400).json({ msg: 'Se requiere un listado de IDs de expedientes.' });
  }

  try {
    // ============================================
    // 1. ACTUALIZAR ESTADO DE LOS EXPEDIENTES
    // ============================================
    // Solo se transfieren expedientes que estén en estado "Cerrado en Gestión"
    // El nuevo estado será "Cerrado en Central" (transferencia primaria completada)
    const [result] = await pool.query(
      "UPDATE expedientes SET estado = 'Cerrado en Central' WHERE id IN (?) AND estado = 'Cerrado en Gestión'",
      [expedientesIds]
    );

    // Verificar que al menos un expediente fue transferido
    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: 'Ningún expediente fue transferido. Verifique que existan y que su estado sea "Cerrado en Gestión".' });
    }

    // ============================================
    // 2. REGISTRAR EN AUDITORÍA
    // ============================================
    // Guardar registro de la transferencia para trazabilidad
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [id_usuario_accion, 'TRANSFERENCIA_PRIMARIA', `Se transfirieron ${result.affectedRows} expedientes al Archivo Central. IDs: ${expedientesIds.join(', ')}`]
    );

    // Responder con la cantidad de expedientes transferidos exitosamente
    res.json({ msg: `${result.affectedRows} expedientes han sido transferidos con éxito.` });

  } catch (error) {
    console.error("Error al realizar la transferencia:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};