const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan, silakan login' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token sudah kadaluarsa' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
}

module.exports = authMiddleware;
