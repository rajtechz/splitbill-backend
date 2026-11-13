import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'splitmate_jwt_secret_dev_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'splitmate_refresh_jwt_dev_key_2026',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splitmate',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TzYOq8vZZErm5Y',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'ZPYghGmx4KV5I3MELBGJZb2F',
};

