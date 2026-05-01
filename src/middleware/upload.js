const multer = require('multer');
const ApiError = require('../helpers/apiError');
const { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } = require('../config/constants');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(ApiError.badRequest(`File type ${file.mimetype} not allowed`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

module.exports = upload;
