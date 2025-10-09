// Archivo: backend/src/controllers/search.controller.js
const pool = require('../config/db');

// Búsqueda global en documentos y expedientes
exports.search = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ msg: 'El término de búsqueda es obligatorio.' });
  }

  try {
    // 2. Preparamos el término de búsqueda para usarlo con LIKE
    const searchTerm = `%${q}%`;

    const [documentosResults, expedientesResults] = await Promise.all([
      // 3. Modificamos la consulta para buscar en el asunto O en el contenido extraído
      pool.query(
          "SELECT id, radicado, asunto FROM documentos WHERE asunto LIKE ? OR contenido_extraido LIKE ?", 
          [searchTerm, searchTerm]
      ),
      pool.query(
          "SELECT id, nombre_expediente, estado FROM expedientes WHERE nombre_expediente LIKE ?", 
          [searchTerm]
      )
    ]);
    // 4. Devolvemos los resultados combinados
    res.json({
      documentos: documentosResults[0],
      expedientes: expedientesResults[0]
    });

  } catch (error) {
    console.error("Error en la búsqueda:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};