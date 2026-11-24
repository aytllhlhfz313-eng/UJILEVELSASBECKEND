// Centralized error handler
function errorMiddleware(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);

  // Multer / validation errors
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Format JSON tidak valid' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';
  // Avoid leaking internal details
  const safeMessage = status === 500 ? 'Terjadi kesalahan pada server' : message;
  res.status(status).json({ success: false, message: safeMessage });
}

module.exports = errorMiddleware;
