const { verifyAccessToken } = require('../helpers/token');
const ApiError = require('../helpers/apiError');
const User = require('../models/User');

const authenticate = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw ApiError.unauthorized('Missing token');

  const token = header.split(' ')[1];
  const decoded = verifyAccessToken(token);

  const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('-passwordHash -resetPasswordHash');
  if (!user) throw ApiError.unauthorized('User not found');

  req.user = user;
  next();
};

const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient permissions');
  next();
};

module.exports = { authenticate, authorize };
