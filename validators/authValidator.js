const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi').isEmail().withMessage('Format email tidak valid').isLength({ max: 150 }),
  body('password').notEmpty().withMessage('Password wajib diisi').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role')
    .optional({ values: 'falsy' })
    .isIn(['admin', 'user'])
    .withMessage('Role harus admin atau user'),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email wajib diisi').isEmail().withMessage('Format email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

module.exports = { registerValidator, loginValidator };
