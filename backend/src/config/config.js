// config.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const result = dotenv.config({ 
  path: path.resolve(__dirname, '../../.env') 
});

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Validate required environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'SESSION_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export default {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  jwt: {
    secret: process.env.JWT_SECRET
  },
  session: {
    secret: process.env.SESSION_SECRET
  },
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development'
};