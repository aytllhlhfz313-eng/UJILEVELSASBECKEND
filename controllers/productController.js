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

function toNumber(v) {
  if (v === undefined || v === null || v === '') return v;
  return Number(v);
}

async function ensureCategoryExists(categoryId) {
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
  return rows.length > 0;
}

// Build product response with category name
async function fetchProduct(id) {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.id ASC`
    );
    return res.status(200).json({ success: true, message: 'Data produk berhasil ditampilkan', data: rows });
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
    const product = await fetchProduct(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    return res.status(200).json({ success: true, message: 'Data produk berhasil ditampilkan', data: product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.create = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;

  // Coerce multipart string values
  const name = req.body.name;
  const category_id = toNumber(req.body.category_id);
  const description = req.body.description;
  const price = toNumber(req.body.price);
  const stock = req.body.stock !== undefined ? toNumber(req.body.stock) : 0;
  let image_url = req.body.image_url;
  let image_public_id = req.body.image_public_id;

  try {
    if (!(await ensureCategoryExists(category_id))) {
      return res.status(400).json({ success: false, message: 'Kategori tidak valid' });
    }

    // Handle file upload if present
    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({ success: false, message: 'Cloudinary belum dikonfigurasi' });
      }
      const uploaded = await uploadBuffer(req.file.buffer);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    }

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, description, price, stock, image_url, image_public_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, description || null, price, stock, image_url || null, image_public_id || null]
    );

    const product = await fetchProduct(result.insertId);
    return res.status(201).json({ success: true, message: 'Produk berhasil dibuat', data: product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

exports.update = async (req, res) => {
  const v = handleValidation(req, res);
  if (v) return;
  const { id } = req.params;

  try {
    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    const existing = existingRows[0];

    const name = req.body.name !== undefined ? req.body.name : existing.name;
    const category_id = req.body.category_id !== undefined ? toNumber(req.body.category_id) : existing.category_id;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const price = req.body.price !== undefined ? toNumber(req.body.price) : existing.price;
    const stock = req.body.stock !== undefined ? toNumber(req.body.stock) : existing.stock;

    if (!(await ensureCategoryExists(category_id))) {
      return res.status(400).json({ success: false, message: 'Kategori tidak valid' });
    }

    let image_url = existing.image_url;
    let image_public_id = existing.image_public_id;

    // If a new file uploaded, replace
    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({ success: false, message: 'Cloudinary belum dikonfigurasi' });
      }
      const uploaded = await uploadBuffer(req.file.buffer);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    } else {
      // Allow explicit image_url/public_id override (e.g. from /api/upload)
      if (req.body.image_url !== undefined) image_url = req.body.image_url || null;
      if (req.body.image_public_id !== undefined) image_public_id = req.body.image_public_id || null;
    }

    await pool.query(
      `UPDATE products SET category_id=?, name=?, description=?, price=?, stock=?, image_url=?, image_public_id=? WHERE id=?`,
      [category_id, name, description || null, price, stock, image_url, image_public_id, id]
    );

    if (existing.image_public_id && existing.image_public_id !== image_public_id) {
      await deleteImage(existing.image_public_id);
    }

    const product = await fetchProduct(id);
    return res.status(200).json({ success: true, message: 'Produk berhasil diperbarui', data: product });
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
    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    const existing = existingRows[0];

    // Delete image from Cloudinary
    await deleteImage(existing.image_public_id);

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Produk berhasil dihapus', data: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
