const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  URL_BACKEND: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  URL_FRONTEND: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;