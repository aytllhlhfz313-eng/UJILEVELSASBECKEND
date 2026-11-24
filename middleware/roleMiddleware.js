function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Belum terautentikasi' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses' });
    }
    next();
  };
}

module.exports = roleMiddleware;
