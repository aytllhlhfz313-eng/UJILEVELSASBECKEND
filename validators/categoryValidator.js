const { body, param } = require('express-validator');

const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Nama kategori wajib diisi').isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter'),
  body('description').optional().isString().withMessage('Deskripsi harus berupa teks'),
];

const updateCategoryValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
  body('name').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong').isLength({ max: 100 }),
  body('description').optional().isString(),
];

const idParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
];

module.exports = { createCategoryValidator, updateCategoryValidator, idParamValidator };
