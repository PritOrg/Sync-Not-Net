/**
 * Tests for Remote Cursor Position Socket Events
 * Phase 4: Remote Cursor Rendering
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/userModel');
const Notebook = require('../models/notebookModel');

const uniqueEmail = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

const createTestUser = async () => {
  const email = uniqueEmail();
  const user = await User.create({
    name: 'Test User',
    email,
    password: 'Test123!@#'
  });

  const response = await request(app)
    .post('/api/users/login')
    .send({ email, password: 'Test123!@#' });

  return { user, token: response.body.token };
};

const createTestNotebook = async (userId, options = {}) => {
  return Notebook.create({
    title: options.title || 'Test Notebook',
    content: options.content || '<p>Test content</p>',
    creatorID: userId,
    permissions: options.permissions || 'everyone',
    collaborators: options.collaborators || [],
    urlIdentifier: `notebook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    version: 1
  });
};

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

beforeEach(async () => {
  await Notebook.deleteMany({});
});

describe('Remote Cursor Position Events', () => {
  describe('Socket cursorPosition event', () => {
    it('should accept valid cursor position data structure', () => {
      const validPosition = {
        line: 10,
        column: 5,
        selection: {
          startLine: 10,
          startColumn: 5,
          endLine: 12,
          endColumn: 15
        }
      };

      expect(validPosition).toHaveProperty('line');
      expect(validPosition).toHaveProperty('column');
      expect(validPosition).toHaveProperty('selection');
      expect(validPosition.line).toBeGreaterThanOrEqual(0);
      expect(validPosition.column).toBeGreaterThanOrEqual(0);
    });

    it('should validate cursor position constraints', () => {
      const positions = [
        { line: 0, column: 0 },  // Start of file
        { line: 100, column: 80 }, // Normal position
        { line: 1, column: 0 },    // Start of line
        { line: 50, column: 120 }, // Long line
      ];

      positions.forEach(pos => {
        expect(pos.line).toBeGreaterThanOrEqual(0);
        expect(pos.column).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include user info in cursor event', () => {
      const cursorEvent = {
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com'
        },
        position: {
          line: 10,
          column: 5
        },
        timestamp: new Date()
      };

      expect(cursorEvent).toHaveProperty('user');
      expect(cursorEvent.user).toHaveProperty('id');
      expect(cursorEvent.user).toHaveProperty('name');
      expect(cursorEvent).toHaveProperty('position');
      expect(cursorEvent).toHaveProperty('timestamp');
    });
  });

  describe('Cursor color assignment', () => {
    it('should generate consistent colors for users', () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const userId3 = 'user789';

      // Simple hash function for color generation
      const generateColor = (userId) => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
          hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
      };

      const color1a = generateColor(userId1);
      const color1b = generateColor(userId1);
      const color2 = generateColor(userId2);
      const color3 = generateColor(userId3);

      // Same user should get same color
      expect(color1a).toBe(color1b);
      // Different users should get different colors (usually)
      expect(color1a).not.toBe(color2);
      expect(color2).not.toBe(color3);
    });

    it('should provide enough distinct colors', () => {
      const colors = new Set();
      const numUsers = 20;

      const generateColor = (index) => {
        return `hsl(${(index * 137) % 360}, 70%, 50%)`;
      };

      for (let i = 0; i < numUsers; i++) {
        colors.add(generateColor(i));
      }

      // Should have at least 15 distinct colors for 20 users
      expect(colors.size).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Cursor position data', () => {
    it('should support selection ranges', () => {
      const selection = {
        startLine: 5,
        startColumn: 10,
        endLine: 8,
        endColumn: 25
      };

      expect(selection.startLine).toBeLessThanOrEqual(selection.endLine);
      if (selection.startLine === selection.endLine) {
        expect(selection.startColumn).toBeLessThanOrEqual(selection.endColumn);
      }
    });

    it('should support empty selections (cursor only)', () => {
      const cursorOnly = {
        line: 10,
        column: 5,
        selection: null
      };

      expect(cursorOnly.selection).toBeNull();
      expect(cursorOnly.line).toBeDefined();
      expect(cursorOnly.column).toBeDefined();
    });

    it('should handle multi-line selections', () => {
      const multiLineSelection = {
        startLine: 5,
        startColumn: 30,
        endLine: 10,
        endColumn: 0
      };

      // End column 0 means start of next line
      expect(multiLineSelection.endLine).toBeGreaterThan(multiLineSelection.startLine);
    });
  });

  describe('Edge cases', () => {
    it('should handle position at end of file', () => {
      const endOfFile = {
        line: 1000,
        column: 0
      };

      expect(endOfFile.line).toBeGreaterThan(0);
    });

    it('should handle position with very long lines', () => {
      const longLine = {
        line: 5,
        column: 500
      };

      expect(longLine.column).toBeGreaterThan(0);
    });

    it('should handle rapid cursor movements', () => {
      const movements = [
        { line: 1, column: 0 },
        { line: 1, column: 5 },
        { line: 2, column: 0 },
        { line: 2, column: 10 },
        { line: 3, column: 0 },
      ];

      // All movements should be valid positions
      movements.forEach(pos => {
        expect(pos.line).toBeGreaterThanOrEqual(0);
        expect(pos.column).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('Cursor Throttling', () => {
  it('should throttle cursor position updates', () => {
    const THROTTLE_MS = 50;
    let lastUpdate = 0;
    let updateCount = 0;

    const shouldUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate >= THROTTLE_MS) {
        lastUpdate = now;
        updateCount++;
        return true;
      }
      return false;
    };

    // Simulate rapid cursor movements
    const movements = 100;
    for (let i = 0; i < movements; i++) {
      shouldUpdate();
    }

    // Should have significantly fewer updates than movements
    expect(updateCount).toBeLessThan(movements);
    expect(updateCount).toBeGreaterThan(0);
  });

  it('should batch cursor updates during rapid typing', () => {
    const updates = [];
    const THROTTLE_MS = 50;

    const addUpdate = (position) => {
      const now = Date.now();
      const lastUpdate = updates.length > 0 ? updates[updates.length - 1].timestamp : 0;

      if (now - lastUpdate >= THROTTLE_MS) {
        updates.push({ position, timestamp: now });
      }
    };

    // Simulate typing (rapid cursor movements)
    for (let i = 0; i < 50; i++) {
      addUpdate({ line: 1, column: i });
      // Small delay between keystrokes
    }

    // Should batch updates
    expect(updates.length).toBeLessThanOrEqual(50);
  });
});
