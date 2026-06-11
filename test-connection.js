require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellipolicy';

console.log('Testing connection to:', uri.replace(/:[^@]*@/, ':****@'));

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
  });
