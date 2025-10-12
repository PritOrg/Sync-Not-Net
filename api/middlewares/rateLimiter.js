const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Configure rate limiters
const generalRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'limiter:general',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) / 1000 || 900, // convert ms to seconds
});

const authRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'limiter:auth',
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
  blockDuration: 1800, // block for 30 minutes if exceeded
});

const rateLimitMiddleware = (limiter) => async (req, res, next) => {
  try {
    const ip = req.ip;
    await limiter.consume(ip);
    next();
  } catch (error) {
    if (error.msBeforeNext) {
      res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)));
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.round(error.msBeforeNext / 1000)
      });
    } else {
      next(error);
    }
  }
};

module.exports = {
  generalRateLimiter: rateLimitMiddleware(generalRateLimiter),
  authRateLimiter: rateLimitMiddleware(authRateLimiter)
};