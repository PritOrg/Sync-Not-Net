require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-not-net',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-test-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || null,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  socket: {
    maxConnectionsPerIp: parseInt(process.env.SOCKET_MAX_CONNECTIONS_PER_IP, 10) || 10,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  security: {
    bcryptSaltRounds: 12,
    passwordMinLength: 6,
    maxLoginAttempts: 5,
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
  },
};

module.exports = config;
