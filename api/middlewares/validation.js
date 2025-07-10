const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Notebook validation rules
const validateNotebookCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .isLength({ max: 1000000 }) // 1MB limit for content
    .withMessage('Content is too large (max 1MB)'),
  
  body('permissions')
    .optional()
    .isIn(['everyone', 'creator-only'])
    .withMessage('Permissions must be either "everyone" or "creator-only"'),
  
  body('collaborators')
    .optional()
    .isArray()
    .withMessage('Collaborators must be an array')
    .custom((collaborators) => {
      if (collaborators && collaborators.length > 50) {
        throw new Error('Maximum 50 collaborators allowed');
      }
      if (collaborators) {
        for (let i = 0; i < collaborators.length; i++) {
          const collaborator = collaborators[i];
          // Handle both string IDs and object format
          const collaboratorId = typeof collaborator === 'string' ? collaborator : collaborator._id || collaborator.id;
          
          if (!collaboratorId) {
            throw new Error(`Collaborator at index ${i} is missing an ID`);
          }
          
          if (!isValidObjectId(collaboratorId)) {
            throw new Error(`Invalid collaborator ID format at index ${i}: ${collaboratorId}`);
          }
        }
      }
      return true;
    }),
  
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be between 4 and 50 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length > 20) {
        throw new Error('Maximum 20 tags allowed');
      }
      if (tags) {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.length > 30) {
            throw new Error('Each tag must be a string with maximum 30 characters');
          }
        }
      }
      return true;
    }),
  
  body('editorMode')
    .optional()
    .isIn(['quill', 'monaco'])
    .withMessage('Editor mode must be either "quill" or "monaco"'),
  
  body('autoSave')
    .optional()
    .isBoolean()
    .withMessage('Auto save must be a boolean value'),
  
  handleValidationErrors
];

const validateNotebookUpdate = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid notebook ID format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .isLength({ max: 1000000 })
    .withMessage('Content is too large (max 1MB)'),
  
  body('permissions')
    .optional()
    .isIn(['everyone', 'creator-only'])
    .withMessage('Permissions must be either "everyone" or "creator-only"'),
  
  body('collaborators')
    .optional()
    .isArray()
    .withMessage('Collaborators must be an array')
    .custom((collaborators) => {
      if (collaborators && collaborators.length > 50) {
        throw new Error('Maximum 50 collaborators allowed');
      }
      if (collaborators) {
        for (const id of collaborators) {
          if (!isValidObjectId(id)) {
            throw new Error('Invalid collaborator ID format');
          }
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateNotebookAccess = [
  param('urlIdentifier')
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid URL identifier'),
  
  handleValidationErrors
];

const validateUrlUpdate = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid notebook ID format'),
  
  body('urlIdentifier')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('URL identifier must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('URL identifier can only contain letters, numbers, hyphens, and underscores')
    .not()
    .matches(/^(api|admin|www|blog|help|support|contact|about|terms|privacy|public|static|assets|new|create|edit|signin|signup|login|logout|notebooks|shared)$/i)
    .withMessage('This URL identifier is reserved and cannot be used'),
  
  handleValidationErrors
];

const validateUserSearch = [
  query('query')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
  
  handleValidationErrors
];

const validateObjectId = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateNotebookCreation,
  validateNotebookUpdate,
  validateNotebookAccess,
  validateUrlUpdate,
  validateUserSearch,
  validateObjectId,
  handleValidationErrors
};
