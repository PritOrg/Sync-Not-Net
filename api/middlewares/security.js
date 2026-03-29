const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const config = require('../config');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: message || 'Too many requests, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

const generalLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests,
  'Too many requests, please try again later.'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts. Please try again later.'
);

const socketLimiter = createRateLimiter(
  60 * 1000,
  10,
  'Too many socket connections. Please try again later.'
);

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
  mongoSanitize(),
  xss(),
  hpp({
    whitelist: ['tags', 'collaborators'],
  }),
];

module.exports = {
  generalLimiter,
  authLimiter,
  socketLimiter,
  securityMiddleware,
};
