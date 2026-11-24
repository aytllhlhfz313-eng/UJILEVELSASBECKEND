const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = process.env.CLOUDINARY_FOLDER || 'contre_store/products';

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} [publicId]
 * @returns {Promise<{url:string, public_id:string}>}
 */
async function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const options = {
      folder: FOLDER,
      resource_type: 'image',
    };
    if (publicId) options.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id.
 * @param {string} publicId
 */
async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message);
  }
}

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

module.exports = { cloudinary, uploadBuffer, deleteImage, isConfigured, FOLDER };
