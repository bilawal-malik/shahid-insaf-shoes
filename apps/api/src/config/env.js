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
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : Number(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'SIS Shoes <no-reply@localhost>',
    notify: process.env.NOTIFY_EMAIL || '',
    brevoKey: process.env.BREVO_API_KEY || '',
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
