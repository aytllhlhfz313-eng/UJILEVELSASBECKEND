const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { createCategoryValidator, updateCategoryValidator, idParamValidator } = require('../validators/categoryValidator');
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

router.get('/', authMiddleware, categoryController.getAll);
router.get('/:id', authMiddleware, idParamValidator, validate, categoryController.getById);
// Hanya admin yang boleh mengubah kategori beserta gambarnya; user biasa cukup membaca
router.post('/', authMiddleware, roleMiddleware('admin'), uploadSingle('image'), createCategoryValidator, validate, categoryController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), uploadSingle('image'), updateCategoryValidator, validate, categoryController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), idParamValidator, validate, categoryController.remove);

module.exports = router;
