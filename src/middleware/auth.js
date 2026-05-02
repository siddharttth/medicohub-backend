const { verifyAccessToken } = require('../helpers/token');
const ApiError = require('../helpers/apiError');
const User = require('../models/User');

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization;
  if (header) {
    if (header.startsWith('Bearer ')) return header.split(' ')[1];
    return header;
  }

  const altHeader = req.headers['x-access-token'] || req.headers['x-auth-token'];
  if (altHeader) return altHeader;

  if (req.body && req.body.token) return req.body.token;
  if (req.query && req.query.token) return req.query.token;

  return null;
};

const authenticate = async (req, _res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    console.error('[Auth] Missing token', {
      authorization: req.headers.authorization,
      xAccessToken: req.headers['x-access-token'],
      xAuthToken: req.headers['x-auth-token'],
      queryToken: req.query?.token,
      bodyToken: req.body?.token,
    });
    throw ApiError.unauthorized('Missing token');
  }

  const decoded = verifyAccessToken(token);

  const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('-passwordHash -resetPasswordHash');
  if (!user) throw ApiError.unauthorized('User not found');

  req.user = user;
  next();
};

const optionalAuthenticate = async (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('-passwordHash -resetPasswordHash');
    if (user) req.user = user;
  } catch (err) {
    // Ignore invalid/expired tokens and continue as guest
  }
  next();
};

const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient permissions');
  next();
};

module.exports = { authenticate, authorize, optionalAuthenticate };
