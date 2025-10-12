const validateEnv = () => {
  // Always required variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN'
  ];

  // Production-only required variables
  const productionRequiredVars = [
    'REDIS_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    const missingProdVars = productionRequiredVars.filter(varName => !process.env[varName]);
    if (missingProdVars.length > 0) {
      throw new Error(`Missing production-required environment variables: ${missingProdVars.join(', ')}`);
    }
    // Additional production-specific validations
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }

    if (!process.env.CORS_ORIGIN.startsWith('https://') && process.env.CORS_ORIGIN !== 'http://localhost:3000') {
      throw new Error('CORS_ORIGIN must use HTTPS in production');
    }
  }

  // Validate and set defaults for optional variables
  process.env.SOCKET_MAX_CONNECTIONS_PER_IP = process.env.SOCKET_MAX_CONNECTIONS_PER_IP || '10';
  process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '100';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

  return true;
};

module.exports = validateEnv;