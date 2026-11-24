require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Contre Store Backend API', data: { version: '1.0.0' } });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// DB test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const { pool } = require('./config/database');
    await pool.query('SELECT 1');
    res.status(200).json({ success: true, message: 'Koneksi database berhasil', data: { database: process.env.DB_NAME } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Koneksi database gagal' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
});

module.exports = app;
