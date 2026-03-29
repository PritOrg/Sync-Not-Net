const logger = require('../utils/logger');
const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleValidationError = (err) => {
  const messages = Object.values(err.errors || {}).map((e) => e.message);
  return new AppError(messages.join('. '), 400, 'VALIDATION_ERROR');
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyPattern || {})[0] || 'field';
  return new AppError(`Duplicate value for ${field}`, 409, 'DUPLICATE_ERROR');
};

const handleCastError = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'CAST_ERROR');
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED');

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.code = err.code || 'INTERNAL_ERROR';

  let error = { ...err, message: err.message };

  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  logger.error(`${error.statusCode} - ${error.message}`, {
    path: req.path,
    method: req.method,
    ...(config.env === 'development' && { stack: err.stack }),
  });

  res.status(error.statusCode).json({
    error: error.code,
    message: error.isOperational ? error.message : 'Something went wrong',
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  const error = new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const validateBody = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    for (const rule of rules) {
      const error = rule(value, field);
      if (error) {
        errors.push({ field, message: error });
        break;
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: errors[0].message,
      details: errors,
    });
  }

  next();
};

const validationRules = {
  required: (value, field) => {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      return `${field} is required`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please provide a valid email';
    return null;
  },

  minLength: (min) => (value, field) => {
    if (!value) return null;
    if (value.length < min) return `${field} must be at least ${min} characters`;
    return null;
  },

  maxLength: (max) => (value, field) => {
    if (!value) return null;
    if (value.length > max) return `${field} must be at most ${max} characters`;
    return null;
  },

  string: (value, field) => {
    if (value !== undefined && typeof value !== 'string') return `${field} must be a string`;
    return null;
  },
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  notFound,
  validateBody,
  validationRules,
};
