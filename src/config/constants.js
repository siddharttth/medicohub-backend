const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology',
  'Microbiology', 'Forensic Medicine', 'Community Medicine', 'Medicine',
  'Surgery', 'Obstetrics & Gynaecology', 'Paediatrics', 'Orthopaedics',
  'Ophthalmology', 'ENT', 'Dermatology', 'Psychiatry', 'Radiology',
  'Anaesthesia', 'Other',
];

const NOTE_TYPES = ['PDF', 'Handwritten', 'Diagram', 'PYQ', 'DOC', 'CSV', 'Image', 'Other'];
const YEARS = ['1st', '2nd', '3rd', 'Final'];
const ROLES = ['user', 'verified-senior', 'admin'];
const PLATFORMS = ['ios', 'android', 'web'];
const PACK_TYPES = ['full-pack', 'viva-only', 'quick-review'];

const NOTIFICATION_TYPES = [
  'note-approved', 'message-received', 'achievement-unlocked', 'new-drop', 'mention',
];

const ACHIEVEMENT_TYPES = [
  'night-owl', 'verified-contributor', 'top-rated',
  '30-day-streak', 'first-upload', 'helpful-senior', 'power-user',
];

const AUDIT_ACTIONS = ['approve-note', 'reject-note', 'delete-message', 'ban-user', 'flag-content'];
const TARGET_TYPES = ['note', 'message', 'user'];

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const EXAM_PACK_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_PACKS_PER_DAY = 3;
const MAX_VIVA_PER_DAY = 5;

const LOGIN_MAX_ATTEMPTS = 2;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

module.exports = {
  SUBJECTS, NOTE_TYPES, YEARS, ROLES, PLATFORMS, PACK_TYPES,
  NOTIFICATION_TYPES, ACHIEVEMENT_TYPES, AUDIT_ACTIONS, TARGET_TYPES,
  ALLOWED_FILE_TYPES, MAX_FILE_SIZE,
  ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, RESET_TOKEN_EXPIRY_MS, EXAM_PACK_CACHE_TTL_MS,
  MAX_PACKS_PER_DAY, MAX_VIVA_PER_DAY,
  LOGIN_MAX_ATTEMPTS, LOGIN_LOCK_DURATION_MS,
};
