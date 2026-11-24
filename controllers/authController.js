const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
}

exports.register = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  const { name, email, password } = req.body;
  // Role dipilih sendiri saat mendaftar. Hanya dua nilai yang diterima; nilai
  // lain jatuh ke 'user' supaya tidak ada role asing yang lolos ke database.
  const role = String(req.body.role || '').trim().toLowerCase();
  const finalRole = role === 'admin' ? 'admin' : 'user';
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, finalRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { id: result.insertId, name, email, role: finalRole },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.login = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    return res.status(200).json({ success: true, message: 'Data user', data: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
