const { pool } = require('../config/database');
const { validationResult } = require('express-validator');
const { deleteImage, uploadBuffer, isConfigured } = require('../config/cloudinary');

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

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return res.status(200).json({ success: true, message: 'Data kategori berhasil ditampilkan', data: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.getById = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    return res.status(200).json({ success: true, message: 'Data kategori berhasil ditampilkan', data: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.create = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;
  const { name, description } = req.body;
  let image_url = req.body.image_url;
  let image_public_id = req.body.image_public_id;
  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
    }

    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({ success: false, message: 'Cloudinary belum dikonfigurasi' });
      }
      const uploaded = await uploadBuffer(req.file.buffer);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description, image_url, image_public_id) VALUES (?, ?, ?, ?)',
      [name, description || null, image_url || null, image_public_id || null]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.update = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    const old = existing[0];

    if (name) {
      const [dup] = await pool.query('SELECT id FROM categories WHERE name = ? AND id <> ?', [name, id]);
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
      }
    }

    const newName = name !== undefined ? name : old.name;
    const newDesc = description !== undefined ? description : old.description;

    let image_url = old.image_url;
    let image_public_id = old.image_public_id;

    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({ success: false, message: 'Cloudinary belum dikonfigurasi' });
      }
      await deleteImage(old.image_public_id);
      const uploaded = await uploadBuffer(req.file.buffer);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    } else if (req.body.clear_image === 'true' || req.body.clear_image === true) {
      await deleteImage(old.image_public_id);
      image_url = null;
      image_public_id = null;
    } else {
      if (req.body.image_url !== undefined) image_url = req.body.image_url || null;
      if (req.body.image_public_id !== undefined) image_public_id = req.body.image_public_id || null;
    }

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, image_url = ?, image_public_id = ? WHERE id = ?',
      [newName, newDesc, image_url, image_public_id, id]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Kategori berhasil diperbarui', data: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.remove = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const [products] = await pool.query('SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?', [id]);
    if (products[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak dapat dihapus karena masih digunakan oleh produk',
      });
    }

    await deleteImage(existing[0].image_public_id);
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Kategori berhasil dihapus', data: null });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({ success: false, message: 'Kategori tidak dapat dihapus karena masih digunakan oleh produk' });
    }
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};