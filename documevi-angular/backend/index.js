require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '7213271',
    database: 'documevi'
});

db.connect(err => {
    if (err) {
        console.error('Error de conexión a MySQL:', err);
        return;
    }
    console.log('Conectado a MySQL');
});

// Ruta de prueba
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(result);
        }
    });
});

// Iniciar servidor
app.listen(3306, () => {
    console.log('Servidor corriendo en http://localhost:3306');
});