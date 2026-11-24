const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

router.post('/', authMiddleware, roleMiddleware('admin'), uploadSingle('image'), uploadController.upload);

module.exports = router;
