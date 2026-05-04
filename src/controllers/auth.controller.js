const User = require('../models/User');
const { hashPassword, comparePassword } = require('../helpers/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken, generateResetToken, hashToken } = require('../helpers/token');
const { success, created } = require('../helpers/response');
const ApiError = require('../helpers/apiError');
const emailService = require('../services/email.service');
const achievementService = require('../services/achievement.service');
const { LOGIN_MAX_ATTEMPTS, LOGIN_LOCK_DURATION_MS, RESET_TOKEN_EXPIRY_MS } = require('../config/constants');

const formatUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  college: user.college,
  year: user.year,
  avatar: user.avatar,
  role: user.role,
  streakDays: user.streakDays,
});

exports.register = async (req, res) => {
  const { email, password, name, college, year } = req.body;
  console.log('[Auth:Register] start', { email, name, college, year });

  const exists = await User.findOne({ email });
  if (exists) {
    console.log('[Auth:Register] conflict - email already registered', email);
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, name, college, year });
  console.log('[Auth:Register] user created', { id: user._id.toString(), email: user.email });

  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  console.log('[Auth:Register] refresh token saved for user', user._id.toString());

  emailService.sendWelcome(user).catch((err) => {
    console.error('[Auth:Register] welcome email failed', err);
  });
  achievementService.seedForUser(user._id).catch((err) => {
    console.error('[Auth:Register] seed achievements failed', err);
  });

  console.log('[Auth:Register] sending response', { userId: user._id.toString() });
  created(res, { accessToken, refreshToken, user: formatUser(user) }, 'Registration successful');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  if (user.lockUntil && user.lockUntil > Date.now()) {
    const waitMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw ApiError.tooMany(`Account locked. Try again in ${waitMins} minute(s)`);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= LOGIN_MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw ApiError.unauthorized('Invalid credentials');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id });
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  success(res, { accessToken, refreshToken, user: formatUser(user) }, 'Login successful');
};

exports.logout = async (req, res) => {
  const user = req.user;
  user.refreshTokenHash = null;
  await user.save();
  success(res, {}, 'Logged out');
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('+refreshTokenHash');
  if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const newAccessToken = signAccessToken({ userId: user._id, role: user.role });
  const newRefreshToken = signRefreshToken({ userId: user._id });
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
};

exports.me = async (req, res) => {
  success(res, { user: formatUser(req.user) });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, deletedAt: null });

  // Always return 200 to avoid email enumeration
  if (user) {
    const { raw, hash } = generateResetToken();
    user.resetPasswordHash = hash;
    user.resetPasswordExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await user.save();
    await emailService.sendPasswordReset(user, raw);
  }

  success(res, {}, 'If that email exists, a reset link has been sent');
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const hash = hashToken(token);

  const user = await User.findOne({
    resetPasswordHash: hash,
    resetPasswordExpiry: { $gt: new Date() },
    deletedAt: null,
  });
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash = await hashPassword(newPassword);
  user.resetPasswordHash = null;
  user.resetPasswordExpiry = null;
  user.refreshTokenHash = null;
  await user.save();

  success(res, {}, 'Password reset successful. Please login.');
};
