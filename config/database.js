const mysql = require('mysql2/promise');
require('dotenv').config();

// Aiven (dan penyedia MySQL terkelola lain) memakai port acak dan mewajibkan
// koneksi TLS. Di lokal keduanya dimatikan supaya `npm run dev` tetap jalan.
const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'contre_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL connected to database:', process.env.DB_NAME);
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
