const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });

const deleteFromCloudinary = (publicId, resourceType = 'raw') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

module.exports = { uploadToCloudinary, deleteFromCloudinary };
