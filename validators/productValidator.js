const { body, param } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Nama produk wajib diisi').isLength({ max: 150 }),
  body('category_id').notEmpty().withMessage('Kategori wajib diisi').isInt({ min: 1 }).withMessage('category_id harus angka'),
  body('description').optional({ nullable: true }).isString(),
  body('price').notEmpty().withMessage('Harga wajib diisi').isFloat({ min: 0 }).withMessage('Harga tidak boleh negatif'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stok tidak boleh negatif'),
  body('image_url').optional({ nullable: true }).isString(),
  body('image_public_id').optional({ nullable: true }).isString(),
];

const updateProductValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
  body('name').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong').isLength({ max: 150 }),
  body('category_id').optional().isInt({ min: 1 }).withMessage('category_id harus angka'),
  body('description').optional({ nullable: true }).isString(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Harga tidak boleh negatif'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stok tidak boleh negatif'),
  body('image_url').optional({ nullable: true }).isString(),
  body('image_public_id').optional({ nullable: true }).isString(),
];

const idParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
];

module.exports = { createProductValidator, updateProductValidator, idParamValidator };
