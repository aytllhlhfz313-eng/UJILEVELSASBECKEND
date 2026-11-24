const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { createProductValidator, updateProductValidator, idParamValidator } = require('../validators/productValidator');
const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

router.get('/', authMiddleware, productController.getAll);
router.get('/:id', authMiddleware, idParamValidator, validate, productController.getById);
// Hanya admin yang boleh mengubah produk beserta gambarnya; user biasa cukup membaca
router.post('/', authMiddleware, roleMiddleware('admin'), uploadSingle('image'), createProductValidator, validate, productController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), uploadSingle('image'), updateProductValidator, validate, productController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), idParamValidator, validate, productController.remove);

module.exports = router;
