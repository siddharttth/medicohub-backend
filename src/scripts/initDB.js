require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import all models to register schemas
require('../models/User');
require('../models/Note');
require('../models/ExamPack');
require('../models/Drop');
require('../models/Rating');
require('../models/Bookmark');
require('../models/Achievement');
require('../models/ChatHistory');
require('../models/DeviceToken');
require('../models/Notification');
require('../models/SearchHistory');
require('../models/AuditLog');
require('../models/NoteRequest');
require('../models/UserProgress');

async function initDB() {
  await connectDB();

  const collections = Object.keys(mongoose.connection.collections);
  console.log('\nRegistered models:', Object.keys(mongoose.models));

  // Sync all indexes (creates collections if they don't exist)
  console.log('\nSyncing indexes for all collections...');
  await Promise.all(
    Object.values(mongoose.models).map(async (model) => {
      await model.createIndexes();
      console.log(`  ✓ ${model.modelName}`);
    })
  );

  // Verify collections exist
  const db = mongoose.connection.db;
  const existingCollections = (await db.listCollections().toArray()).map(c => c.name);
  console.log('\nCollections in medicohub DB:');
  existingCollections.forEach(name => console.log(`  - ${name}`));

  console.log('\nDatabase initialization complete.');
  await mongoose.disconnect();
}

initDB().catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
