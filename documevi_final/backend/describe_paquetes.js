const pool = require('./src/config/db');

async function describeTable() {
    try {
        const [rows] = await pool.query("DESCRIBE paquetes");
        console.log("Paquetes Schema:", JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

describeTable();
