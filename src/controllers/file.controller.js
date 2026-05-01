const { uploadToCloudinary, deleteFromCloudinary } = require('../helpers/cloudinaryUpload');
const { success, created } = require('../helpers/response');
const ApiError = require('../helpers/apiError');

exports.uploadFile = async (req, res) => {
  if (!req.file) throw ApiError.badRequest('File is required');

  const isImage = req.file.mimetype.startsWith('image/');
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'medicohub/attachments',
    resource_type: isImage ? 'image' : 'raw',
    use_filename: true,
  });

  created(res, {
    fileUrl: result.secure_url,
    publicId: result.public_id,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });
};

exports.deleteFile = async (req, res) => {
  // publicId may contain slashes (e.g. medicohub/attachments/foo) — decode it
  const publicId = decodeURIComponent(req.params.publicId);
  const resourceType = req.query.resourceType || 'raw';

  await deleteFromCloudinary(publicId, resourceType);
  success(res, {}, 'File deleted');
};
