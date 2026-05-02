const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medicohub';
  await mongoose.connect(uri, {
    tls: true,
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
  });
  console.log(`MongoDB connected: ${mongoose.connection.host} — db: ${mongoose.connection.name}`);
}

module.exports = connectDB;
