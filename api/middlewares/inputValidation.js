const { body, param, query } = require('express-validator');

// Common patterns
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const OBJECTID_PATTERN = /^[0-9a-fA-F]{24}$/;

// Reusable validation chains
const commonValidations = {
  // User validations
  email: () => 
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .matches(EMAIL_PATTERN)
      .withMessage('Invalid email format'),

  password: () =>
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(PASSWORD_PATTERN)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),

  name: () =>
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z0-9\s-_]+$/)
      .withMessage('Name can only contain letters, numbers, spaces, hyphens and underscores'),

  // Notebook validations
  title: () =>
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),

  content: () =>
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 1000000 })
      .withMessage('Content is too large'),

  tags: () =>
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
      .custom((tags) => {
        if (tags && tags.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        if (tags && tags.some(tag => tag.length > 30)) {
          throw new Error('Tag length cannot exceed 30 characters');
        }
        return true;
      }),

  collaborators: () =>
    body('collaborators')
      .optional()
      .isArray()
      .withMessage('Collaborators must be an array')
      .custom((collaborators) => {
        if (collaborators && collaborators.length > 50) {
          throw new Error('Maximum 50 collaborators allowed');
        }
        if (collaborators && collaborators.some(id => !OBJECTID_PATTERN.test(id))) {
          throw new Error('Invalid collaborator ID format');
        }
        return true;
      }),

  // Common ID validations
  objectId: (paramName) =>
    param(paramName)
      .matches(OBJECTID_PATTERN)
      .withMessage('Invalid ID format'),

  // Search validations
  searchQuery: () =>
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Search query must be between 2 and 50 characters'),

  // Pagination validations
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// Export validation chains for different routes
module.exports = {
  validateUserRegistration: [
    commonValidations.email(),
    commonValidations.password(),
    commonValidations.name()
  ],

  validateUserLogin: [
    commonValidations.email(),
    body('password').notEmpty().withMessage('Password is required')
  ],

  validateNotebookCreate: [
    commonValidations.title(),
    commonValidations.content(),
    commonValidations.tags(),
    commonValidations.collaborators()
  ],

  validateNotebookUpdate: [
    commonValidations.objectId('id'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('content').optional(),
    commonValidations.tags(),
    commonValidations.collaborators()
  ],

  validateSearch: [
    commonValidations.searchQuery(),
    ...commonValidations.pagination()
  ],

  validateObjectId: commonValidations.objectId,
  validatePagination: commonValidations.pagination
};