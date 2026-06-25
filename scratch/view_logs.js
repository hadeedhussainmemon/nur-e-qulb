const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Resolve .env.local path
const envPath = path.resolve(__dirname, '../.env.local');

if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at:', envPath);
  process.exit(1);
}

// Parse MONGODB_URI from .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let mongoUri = '';

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('MONGODB_URI=')) {
    // Strip quotes if present
    mongoUri = trimmed.split('MONGODB_URI=')[1].trim().replace(/^["']|["']$/g, '');
    break;
  }
}

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('Connecting to MongoDB database...');

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected successfully. Fetching NextAuth logs...\n');

    const db = mongoose.connection.db;
    const logs = await db.collection('nextauth_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray();

    if (logs.length === 0) {
      console.log('No NextAuth logs found in the database. Please trigger the login error first.');
    } else {
      console.log(`--- LATEST ${logs.length} NEXTAUTH LOGS ---`);
      for (const log of logs) {
        console.log(`[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] Code: ${log.code}`);
        if (log.metadata) {
          try {
            const parsed = JSON.parse(log.metadata);
            console.log('Metadata:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('Metadata:', log.metadata);
          }
        }
        console.log('--------------------------------------------------');
      }
    }
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

run();
