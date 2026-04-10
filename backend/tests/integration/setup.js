const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Set test environment BEFORE importing server (before dotenv.config() runs)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_integration_tests';
process.env.GOOGLE_CLIENT_ID = 'test_google_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'test_google_client_secret';
process.env.SESSION_SECRET = 'test_session_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_stripe_key_for_testing';

// Mock dotenv to prevent it from overriding environment variables
jest.mock('dotenv', () => ({
  config: jest.fn(() => ({ error: undefined }))
}));

// Mock connectDB to prevent server from trying to connect before we're ready
jest.mock('../../src/config/db', () => jest.fn().mockResolvedValue(undefined));

// Create and start memory server
beforeAll(async () => {
  // Disconnect if already connected (from unit tests)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Set environment variable for database connection
  process.env.MONGODB_URI = uri;
  
  // Connect to the test database
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// Import app after environment is set (but before tests run)
const app = require('../../server');

module.exports = { app };
