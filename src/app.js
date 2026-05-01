require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const noteRoutes = require('./routes/note.routes');
const examRoutes = require('./routes/exam.routes');
const dropRoutes = require('./routes/drop.routes');
const aiRoutes = require('./routes/ai.routes');
const fileRoutes = require('./routes/file.routes');
const notificationRoutes = require('./routes/notification.routes');
const achievementRoutes = require('./routes/achievement.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Security & performance
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Logging
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(morgan('combined', { stream: accessLogStream }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
const API = '/api';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/notes`, noteRoutes);
app.use(`${API}/exam`, examRoutes);
app.use(`${API}/drops`, dropRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/files`, fileRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/achievements`, achievementRoutes);
app.use(`${API}/bookmarks`, bookmarkRoutes);
app.use(`${API}/admin`, adminRoutes);

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Central error handler
app.use(errorHandler);

module.exports = app;
