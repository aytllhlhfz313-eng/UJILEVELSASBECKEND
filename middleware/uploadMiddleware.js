const multer = require('multer');

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format gambar tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

// Wrapper to convert multer errors into consistent JSON
function uploadSingle(fieldName = 'image') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Ukuran gambar maksimal 2 MB' });
        }
        return res.status(400).json({ success: false, message: err.message || 'Gagal upload file' });
      }
      next();
    });
  };
}

module.exports = { upload, uploadSingle, ALLOWED_MIMES, MAX_SIZE };
