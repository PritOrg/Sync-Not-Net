/**
 * Jest Setup File
 * Configures test environment, MongoDB Memory Server, and global test utilities
 */

// Set test environment before any modules are loaded
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test-db';

// Increase timeouts for MongoDB Memory Server startup
jest.setTimeout(30000);

// Suppress console logs during tests (optional, remove if you want logs)
const originalLog = console.log;
const originalError = console.error;

// Allow certain logs through for debugging
const allowedPatterns = ['Error', 'FAIL', 'PASS', 'Tests:'];

beforeAll(() => {
  // Keep some errors visible but suppress general noise
  console.error = jest.fn((...args) => {
    const msg = args.join(' ');
    if (allowedPatterns.some(pattern => msg.includes(pattern))) {
      originalError(...args);
    }
  });
});

afterAll(() => {
  // Restore console
  console.log = originalLog;
  console.error = originalError;
});

// Global test utilities
global.testHelpers = {
  /**
   * Create a JWT token for testing
   */
  createToken: (userId, email = 'test@example.com') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        id: userId,
        email: email,
        role: 'user'
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );
  },

  /**
   * Create test user data
   */
  testUserData: {
    valid: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!'
    },
    duplicate: {
      name: 'Duplicate User',
      email: 'test@example.com',
      password: 'TestPassword123!'
    },
    invalid: {
      shortPassword: {
        name: 'Test',
        email: 'test2@example.com',
        password: '123'
      },
      missingEmail: {
        name: 'Test',
        password: 'TestPassword123!'
      },
      invalidEmail: {
        name: 'Test',
        email: 'not-an-email',
        password: 'TestPassword123!'
      }
    }
  },

  /**
   * Create test notebook data
   */
  testNotebookData: {
    valid: {
      title: 'Test Notebook',
      content: 'Test content',
      format: 'markdown'
    },
    withTags: {
      title: 'Tagged Notebook',
      content: 'Content',
      format: 'markdown',
      tags: ['test', 'important']
    },
    minimal: {
      title: 'Minimal Notebook'
    }
  },

  /**
   * Create test comment data
   */
  testCommentData: {
    valid: {
      content: 'This is a test comment',
      author: 'Test User'
    },
    reply: {
      content: 'This is a reply',
      parentId: null // Will be set to actual comment ID in tests
    }
  }
};

// Suppress MongoDB connection warnings in tests
process.on('unhandledRejection', (reason, promise) => {
  // Ignore specific connection errors in test environment
  if (reason?.message?.includes?.('MongoMemoryServer')) {
    return;
  }
  // Re-throw other unhandled rejections
  throw reason;
});
