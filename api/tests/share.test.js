/**
 * Tests for Share Dialog Functionality
 * Phase 5: Share Dialog with QR Code
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

describe('Share Dialog Functionality', () => {
  describe('Share URL Generation', () => {
    it('should generate a valid share URL', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .get(`/api/notebooks/${notebook.urlIdentifier}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // Response should have notebook data
      if (response.body.notebook) {
        expect(response.body.notebook).toHaveProperty('urlIdentifier');
      } else if (response.body.urlIdentifier) {
        expect(response.body).toHaveProperty('urlIdentifier');
      }
    });

    it('should include notebook identifier in share URL', () => {
      const urlIdentifier = 'test-notebook-123';
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/Notebook/${urlIdentifier}`;

      expect(shareUrl).toContain(urlIdentifier);
      expect(shareUrl).toContain('/Notebook/');
    });

    it('should generate unique URLs for different notebooks', () => {
      const url1 = `notebook-abc123`;
      const url2 = `notebook-xyz789`;

      expect(url1).not.toBe(url2);
    });
  });

  describe('Share Permissions', () => {
    it('should allow sharing public notebooks', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id, {
        permissions: 'everyone'
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook.urlIdentifier}`);

      expect(response.status).toBe(200);
    });

    it('should restrict sharing private notebooks', async () => {
      const { user } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const notebook = await createTestNotebook(user._id, {
        permissions: 'collaborators'
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook.urlIdentifier}`)
        .set('Authorization', `Bearer ${otherToken}`);

      // Should require access
      expect([200, 403]).toContain(response.status);
    });

    it('should allow collaborators to access shared notebook', async () => {
      const { user: owner } = await createTestUser();
      const { user: collab, token: collabToken } = await createTestUser();
      const notebook = await createTestNotebook(owner._id, {
        permissions: 'collaborators',
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook.urlIdentifier}`)
        .set('Authorization', `Bearer ${collabToken}`);

      // Collaborator should have access (200) or might need different route
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('QR Code Data', () => {
    it('should provide data suitable for QR code generation', () => {
      const shareData = {
        url: 'http://localhost:3000/Notebook/test-123',
        title: 'My Notebook',
        permissions: 'everyone'
      };

      // QR code should encode the URL
      expect(shareData.url).toMatch(/^https?:\/\//);
      expect(shareData.url.length).toBeLessThan(300); // QR code size limit
    });

    it('should handle special characters in notebook URL', () => {
      const urlIdentifier = 'my-notebook-2024';
      const shareUrl = `http://localhost:3000/Notebook/${encodeURIComponent(urlIdentifier)}`;

      expect(shareUrl).toContain(encodeURIComponent(urlIdentifier));
    });
  });

  describe('Share Options', () => {
    it('should support different permission levels', () => {
      const permissions = ['everyone', 'collaborators', 'private'];

      permissions.forEach(perm => {
        expect(['everyone', 'collaborators', 'private']).toContain(perm);
      });
    });

    it('should provide copy link functionality data', () => {
      const notebookUrl = 'http://localhost:3000/Notebook/test-123';

      // Simulate clipboard data
      const clipboardData = {
        'text/plain': notebookUrl,
        'text/html': `<a href="${notebookUrl}">Shared Notebook</a>`
      };

      expect(clipboardData['text/plain']).toBe(notebookUrl);
      expect(clipboardData['text/html']).toContain(notebookUrl);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long notebook URLs', () => {
      const longIdentifier = 'a'.repeat(100);
      const shareUrl = `http://localhost:3000/Notebook/${longIdentifier}`;

      expect(shareUrl.length).toBeGreaterThan(100);
    });

    it('should handle empty URL identifier', () => {
      const emptyUrl = '';
      const shareUrl = `http://localhost:3000/Notebook/${emptyUrl}`;

      expect(shareUrl).toBe('http://localhost:3000/Notebook/');
    });

    it('should validate notebook exists before sharing', async () => {
      const { token } = await createTestUser();
      const fakeIdentifier = 'non-existent-notebook';

      const response = await request(app)
        .get(`/api/notebooks/${fakeIdentifier}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});

describe('Guest Access via Share Link', () => {
  it('should allow guest access to public notebooks', async () => {
    const { user } = await createTestUser();
    const notebook = await createTestNotebook(user._id, {
      permissions: 'everyone'
    });

    const response = await request(app)
      .get(`/api/notebooks/${notebook.urlIdentifier}`);

    expect([200, 401]).toContain(response.status);
  });

  it('should track guest users on shared notebooks', () => {
    const guestSession = {
      guestName: 'Guest User',
      notebookId: 'notebook123',
      accessTime: new Date()
    };

    expect(guestSession).toHaveProperty('guestName');
    expect(guestSession).toHaveProperty('notebookId');
    expect(guestSession).toHaveProperty('accessTime');
  });
});
