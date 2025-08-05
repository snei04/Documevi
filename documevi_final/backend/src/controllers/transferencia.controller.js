// Archivo: backend/src/controllers/transferencia.controller.js
const pool = require('../config/db');

exports.realizarTransferencia = async (req, res) => {
  // Esperamos recibir un array con los IDs de los expedientes a transferir
  const { expedientesIds } = req.body;
  const id_usuario_accion = req.user.id;

  if (!expedientesIds || !Array.isArray(expedientesIds) || expedientesIds.length === 0) {
    return res.status(400).json({ msg: 'Se requiere un listado de IDs de expedientes.' });
  }

  try {
    // 1. Actualizamos el estado de todos los expedientes seleccionados
    const [result] = await pool.query(
      "UPDATE expedientes SET estado = 'Cerrado en Central' WHERE id IN (?) AND estado = 'Cerrado en Gestión'",
      [expedientesIds]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: 'Ningún expediente fue transferido. Verifique que existan y que su estado sea "Cerrado en Gestión".' });
    }

    // 2. Registramos la acción en la auditoría
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [id_usuario_accion, 'TRANSFERENCIA_PRIMARIA', `Se transfirieron ${result.affectedRows} expedientes al Archivo Central. IDs: ${expedientesIds.join(', ')}`]
    );

    res.json({ msg: `${result.affectedRows} expedientes han sido transferidos con éxito.` });

  } catch (error) {
    console.error("Error al realizar la transferencia:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};