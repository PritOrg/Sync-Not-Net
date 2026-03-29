const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const logger = require('../utils/logger');
const config = require('../config');

const redisClient = new Redis(config.redis.url);

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

const generalRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'limiter:general',
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

const authRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'limiter:auth',
  points: config.security.maxLoginAttempts,
  duration: 900,
  blockDuration: config.security.lockoutDurationMs / 1000,
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
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.round(error.msBeforeNext / 1000),
      });
    } else {
      next(error);
    }
  }
};

module.exports = {
  generalRateLimiter: rateLimitMiddleware(generalRateLimiter),
  authRateLimiter: rateLimitMiddleware(authRateLimiter),
};
