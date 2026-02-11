const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    try {
        const migrationPath = path.join(__dirname, 'migrations', '20260211_global_paquetes.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log("Applying migration:", sql);
        await pool.query(sql);
        console.log("Migration applied successfully.");
    } catch (error) {
        console.error("Error applying migration:", error);
    } finally {
        process.exit();
    }
}

applyMigration();
