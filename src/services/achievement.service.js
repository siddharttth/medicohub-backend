const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Note = require('../models/Note');
const Drop = require('../models/Drop');
const Rating = require('../models/Rating');
const notificationService = require('./notification.service');

// Achievement definitions — requirements + metadata
const DEFINITIONS = [
  {
    type: 'first-upload',
    title: 'First Upload',
    description: 'Shared your first note with the community',
    icon: '📄',
    requirements: { notesShared: 1 },
    target: 1,
    getProgress: async (userId) => Note.countDocuments({ uploadedBy: userId, deletedAt: null }),
  },
  {
    type: 'verified-contributor',
    title: 'Verified Contributor',
    description: 'Had 5 notes approved by moderators',
    icon: '✅',
    requirements: { notesShared: 5 },
    target: 5,
    getProgress: async (userId) =>
      Note.countDocuments({ uploadedBy: userId, approvalStatus: 'approved', deletedAt: null }),
  },
  {
    type: 'top-rated',
    title: 'Top Rated',
    description: 'Received 10 ratings on your notes',
    icon: '⭐',
    requirements: { likesReceived: 10 },
    target: 10,
    getProgress: async (userId) => {
      const notes = await Note.find({ uploadedBy: userId }).select('_id');
      const noteIds = notes.map(n => n._id);
      return Rating.countDocuments({ noteId: { $in: noteIds } });
    },
  },
  {
    type: '30-day-streak',
    title: '30-Day Streak',
    description: 'Studied for 30 consecutive days',
    icon: '🔥',
    requirements: { streakDays: 30 },
    target: 30,
    getProgress: async (userId) => {
      const user = await User.findById(userId).select('streakDays');
      return user?.streakDays || 0;
    },
  },
  {
    type: 'night-owl',
    title: 'Night Owl',
    description: 'Posted in Drops after midnight 5 times',
    icon: '🦉',
    requirements: { notesShared: 5 },
    target: 5,
    getProgress: async (userId) =>
      Drop.countDocuments({
        author: userId,
        status: 'visible',
        $where: 'new Date(this.createdAt).getHours() >= 0 && new Date(this.createdAt).getHours() < 4',
      }),
  },
  {
    type: 'helpful-senior',
    title: 'Helpful Senior',
    description: 'Had 3 notes bookmarked by others',
    icon: '🎓',
    requirements: { notesShared: 3 },
    target: 3,
    getProgress: async (userId) => {
      const Bookmark = require('../models/Bookmark');
      const notes = await Note.find({ uploadedBy: userId }).select('_id');
      const noteIds = notes.map(n => n._id);
      return Bookmark.countDocuments({ noteId: { $in: noteIds } });
    },
  },
  {
    type: 'power-user',
    title: 'Power User',
    description: 'Asked the AI assistant 20 questions',
    icon: '🤖',
    requirements: { notesShared: 20 },
    target: 20,
    getProgress: async (userId) => {
      const ChatHistory = require('../models/ChatHistory');
      return ChatHistory.countDocuments({ userId });
    },
  },
];

const checkAndAward = async (userId, io = null) => {
  for (const def of DEFINITIONS) {
    const existing = await Achievement.findOne({ userId, type: def.type });
    if (existing?.unlockedAt) continue; // already unlocked

    const current = await def.getProgress(userId);

    if (existing) {
      existing.progress = { current, target: def.target };
      if (current >= def.target) {
        existing.unlockedAt = new Date();
        // Send notification
        const notif = await notificationService.createNotification(
          userId,
          'achievement-unlocked',
          `Achievement Unlocked: ${def.title}`,
          def.description,
        );
        notificationService.broadcastNotification(io, userId, notif);
      }
      await existing.save();
    } else {
      await Achievement.create({
        userId,
        type: def.type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        requirements: def.requirements,
        unlockedAt: current >= def.target ? new Date() : null,
        progress: { current, target: def.target },
      });
      if (current >= def.target) {
        const notif = await notificationService.createNotification(
          userId,
          'achievement-unlocked',
          `Achievement Unlocked: ${def.title}`,
          def.description,
        );
        notificationService.broadcastNotification(io, userId, notif);
      }
    }
  }
};

// Seed all achievement records for a new user with 0 progress
const seedForUser = async (userId) => {
  for (const def of DEFINITIONS) {
    const exists = await Achievement.exists({ userId, type: def.type });
    if (!exists) {
      await Achievement.create({
        userId,
        type: def.type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        requirements: def.requirements,
        unlockedAt: null,
        progress: { current: 0, target: def.target },
      });
    }
  }
};

module.exports = { checkAndAward, seedForUser };
