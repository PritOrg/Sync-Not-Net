const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../index');
const User = require('../models/userModel');
const Notebook = require('../models/notebookModel');

const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

const createTestUser = async (name = 'Test User') => {
  const email = uniqueEmail();
  const user = await User.create({ name, email, password: 'Test123!@#' });
  const res = await request(app).post('/api/users/login').send({ email, password: 'Test123!@#' });
  return { user, token: res.body.token };
};

const createNotebook = async (userId, opts = {}) => {
  return Notebook.create({
    title: opts.title || 'Test Notebook',
    content: '<p>Test content</p>',
    creatorID: userId,
    permissions: opts.permissions || 'everyone',
    collaborators: opts.collaborators || [],
    urlIdentifier: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    version: 1,
    password: opts.password ? await bcrypt.hash(opts.password, 12) : null
  });
};

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 100));
  }
});

beforeEach(async () => {
  await Notebook.deleteMany({});
});

describe('Password Management API', () => {
  describe('POST /api/notebooks/:id/password', () => {
    it('should set password on notebook', async () => {
      const { user, token } = await createTestUser();
      const nb = await createNotebook(user._id);

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'SecretPass123!' });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('message');
    });

    it('should update existing password', async () => {
      const { user, token } = await createTestUser();
      const nb = await createNotebook(user._id, { password: 'OldPass123!' });

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewPass456!' });

      expect([200, 201]).toContain(res.status);
    });

    it('should remove password when empty string sent', async () => {
      const { user, token } = await createTestUser();
      const nb = await createNotebook(user._id, { password: 'OldPass123!' });

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: '' });

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id);

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/password`)
        .send({ password: 'Test123!' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-owner', async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const nb = await createNotebook(owner._id);

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/password`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ password: 'Test123!' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/notebooks/:urlId/verify-password', () => {
    it('should verify correct password and return notebook', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id, { password: 'CorrectPass123!' });

      const res = await request(app)
        .post(`/api/notebooks/${nb.urlIdentifier}/verify-password`)
        .send({ password: 'CorrectPass123!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
    });

    it('should reject incorrect password', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id, { password: 'CorrectPass123!' });

      const res = await request(app)
        .post(`/api/notebooks/${nb.urlIdentifier}/verify-password`)
        .send({ password: 'WrongPass' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if no password provided', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id, { password: 'Test123!' });

      const res = await request(app)
        .post(`/api/notebooks/${nb.urlIdentifier}/verify-password`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});

describe('Collaborator Management API', () => {
  describe('GET /api/users/search', () => {
    it('should search users by name', async () => {
      const { user, token } = await createTestUser('Alice Cooper');
      await createTestUser('Bob Smith');

      const res = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should search users by email', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .get(`/api/users/search?q=${user.email.substring(0, 5)}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should require minimum query length', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/users/search?q=a')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/users/search?q=test');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notebooks/:id/collaborators', () => {
    it('should add collaborators', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      const nb = await createNotebook(owner._id);

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`)
        .send({ collaborators: [{ userId: collab._id, access: 'read' }] });

      expect(res.status).toBe(200);
    });

    it('should update collaborator permission', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      const nb = await createNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'write' });

      expect(res.status).toBe(200);
    });

    it('should remove collaborator', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      const nb = await createNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const res = await request(app)
        .delete(`/api/notebooks/${nb._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});

describe('URL Identifier Management', () => {
  describe('PUT /api/notebooks/:id/url', () => {
    it('should update URL identifier', async () => {
      const { user, token } = await createTestUser();
      const nb = await createNotebook(user._id);

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/url`)
        .set('Authorization', `Bearer ${token}`)
        .send({ urlIdentifier: 'my-custom-url-123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('urlIdentifier');
    });

    it('should reject duplicate URL identifier', async () => {
      const { user, token } = await createTestUser();
      const nb1 = await createNotebook(user._id);
      const nb2 = await createNotebook(user._id);

      await request(app)
        .put(`/api/notebooks/${nb1._id}/url`)
        .set('Authorization', `Bearer ${token}`)
        .send({ urlIdentifier: 'unique-url-123' });

      const res = await request(app)
        .put(`/api/notebooks/${nb2._id}/url`)
        .set('Authorization', `Bearer ${token}`)
        .send({ urlIdentifier: 'unique-url-123' });

      expect([400, 409]).toContain(res.status);
    });

    it('should return 403 for non-owner', async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const nb = await createNotebook(owner._id);

      const res = await request(app)
        .put(`/api/notebooks/${nb._id}/url`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ urlIdentifier: 'hacked-url' });

      expect(res.status).toBe(403);
    });
  });
});

describe('Favorites Management', () => {
  describe('POST /api/notebooks/:id/favorite', () => {
    it('should toggle favorite', async () => {
      const { user, token } = await createTestUser();
      const nb = await createNotebook(user._id);

      const res = await request(app)
        .post(`/api/notebooks/${nb._id}/favorite`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('isFavorite');
    });

    it('should return 401 without auth', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id);

      const res = await request(app)
        .post(`/api/notebooks/${nb._id}/favorite`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notebooks/favorites', () => {
    it('should get favorited notebooks', async () => {
      const { user, token } = await createTestUser();
      const nb = await createNotebook(user._id);

      await request(app)
        .post(`/api/notebooks/${nb._id}/favorite`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/notebooks/favorites')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notebooks');
    });
  });
});

describe('Shared Notebooks', () => {
  describe('GET /api/notebooks/shared', () => {
    it('should get notebooks shared with user', async () => {
      const { user: owner } = await createTestUser();
      const { user: collab, token: collabToken } = await createTestUser();
      
      await createNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const res = await request(app)
        .get('/api/notebooks/shared')
        .set('Authorization', `Bearer ${collabToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notebooks');
    });
  });
});

describe('Guest Access Flow', () => {
  describe('POST /api/notebooks/:urlId/register-guest', () => {
    it('should register guest for public notebook', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id, { permissions: 'everyone' });

      const res = await request(app)
        .post(`/api/notebooks/${nb.urlIdentifier}/register-guest`)
        .send({ guestName: 'Guest User' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('guestUser');
    });

    it('should require guest name', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id);

      const res = await request(app)
        .post(`/api/notebooks/${nb.urlIdentifier}/register-guest`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should indicate password required for protected notebook', async () => {
      const { user } = await createTestUser();
      const nb = await createNotebook(user._id, { 
        permissions: 'everyone',
        password: 'SecretPass123!' 
      });

      const res = await request(app)
        .post(`/api/notebooks/${nb.urlIdentifier}/register-guest`)
        .send({ guestName: 'Guest User' });

      expect(res.status).toBe(200);
      expect(res.body.requiresPassword).toBe(true);
    });
  });
});
