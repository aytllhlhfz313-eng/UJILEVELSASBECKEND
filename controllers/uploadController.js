const { uploadBuffer, isConfigured } = require('../config/cloudinary');

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File gambar wajib diupload' });
    }
    if (!isConfigured()) {
      return res.status(500).json({ success: false, message: 'Cloudinary belum dikonfigurasi' });
    }
    const uploaded = await uploadBuffer(req.file.buffer);
    return res.status(200).json({
      success: true,
      message: 'Upload berhasil',
      data: { url: uploaded.url, public_id: uploaded.public_id },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Gagal upload gambar' });
  }
};
