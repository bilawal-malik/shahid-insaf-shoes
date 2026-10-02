import 'dotenv/config';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  isProd: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3100',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

const required = ['mongodbUri', 'jwtSecret'];
const missing = required.filter((key) => !env[key]);
if (missing.length) {
  console.error(`[config] Missing required env: ${missing.join(', ')}`);
  console.error('Copy .env.example to apps/api/.env and fill the values.');
  process.exit(1);
}

export default env;
