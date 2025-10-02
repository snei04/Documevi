/**
 * Ejecuta una serie de operaciones de base de datos dentro de una transacción.
 * Si algo falla, revierte todos los cambios. Si todo va bien, los confirma.
 * @param {object} pool - La pool de conexiones de mysql2.
 * @param {Function} callback - Una función async que recibe la conexión y contiene la lógica de negocio.
 */
async function withTransaction(pool, callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error; // Re-lanza el error para que el controlador lo capture
    } finally {
        connection.release();
    }
}

module.exports = { withTransaction };