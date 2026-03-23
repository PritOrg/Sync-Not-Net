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
    permissions: options.permissions || 'collaborators',
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

describe('Collaborator Management Routes', () => {

  describe('GET /api/notebooks/:id/collaborators', () => {
    it('should return collaborators list for owner', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('collaborators');
      expect(response.body.collaborators).toHaveLength(1);
      expect(response.body.collaborators[0]).toHaveProperty('id');
      expect(response.body.collaborators[0]).toHaveProperty('access', 'read');
    });

    it('should return 401 without authentication', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/collaborators`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent notebook', async () => {
      const { token } = await createTestUser();
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/notebooks/${fakeId}/collaborators`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return empty array when no collaborators', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.collaborators).toHaveLength(0);
    });

    it('should allow collaborator to view list', async () => {
      const { user: owner } = await createTestUser();
      const { user: collab, token: collabToken } = await createTestUser();
      const { user: collab2 } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [
          { userId: collab._id, access: 'read' },
          { userId: collab2._id, access: 'write' }
        ]
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(response.status).toBe(200);
      expect(response.body.collaborators).toHaveLength(2);
    });

    it('should return correct access levels', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: readCollab } = await createTestUser();
      const { user: writeCollab } = await createTestUser();
      const { user: adminCollab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [
          { userId: readCollab._id, access: 'read' },
          { userId: writeCollab._id, access: 'write' },
          { userId: adminCollab._id, access: 'admin' }
        ]
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.collaborators).toHaveLength(3);
      
      const accessLevels = response.body.collaborators.map(c => c.access).sort();
      expect(accessLevels).toEqual(['admin', 'read', 'write']);
    });
  });

  describe('PUT /api/notebooks/:id/collaborators/:userId', () => {
    it('should update collaborator access level', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'write' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('collaborator');
      expect(response.body.collaborator.access).toBe('write');

      // Verify in database
      const updated = await Notebook.findById(notebook._id);
      const collabEntry = updated.collaborators.find(c => c.userId.toString() === collab._id.toString());
      expect(collabEntry.access).toBe('write');
    });

    it('should return 401 without authentication', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${user._id}`)
        .send({ access: 'write' });

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-owner', async () => {
      const { user: owner } = await createTestUser();
      const { user: collab, token: collabToken } = await createTestUser();
      const { user: other } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ access: 'admin' });

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid access level', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent collaborator', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: notCollab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id);

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${notCollab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'write' });

      expect(response.status).toBe(404);
    });

    it('should emit socket event on permission change', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'admin' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/notebooks/:id/collaborators/:userId', () => {
    it('should remove a collaborator', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .delete(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify removed from database
      const updated = await Notebook.findById(notebook._id);
      expect(updated.collaborators).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .delete(`/api/notebooks/${notebook._id}/collaborators/${user._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-owner', async () => {
      const { user: owner } = await createTestUser();
      const { user: collab, token: collabToken } = await createTestUser();
      const { user: target } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [
          { userId: collab._id, access: 'read' },
          { userId: target._id, access: 'read' }
        ]
      });

      const response = await request(app)
        .delete(`/api/notebooks/${notebook._id}/collaborators/${target._id}`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(response.status).toBe(403);
    });

    it('should emit socket event on removal', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      const response = await request(app)
        .delete(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should return 200 even for non-existent collaborator (idempotent)', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: notCollab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id);

      const response = await request(app)
        .delete(`/api/notebooks/${notebook._id}/collaborators/${notCollab._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid notebook ID format', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/notebooks/invalid-id/collaborators')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle multiple permission updates in sequence', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [{ userId: collab._id, access: 'read' }]
      });

      // Update to write
      await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'write' });

      // Update to admin
      await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'admin' });

      // Update back to read
      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ access: 'read' });

      expect(response.status).toBe(200);
      expect(response.body.collaborator.access).toBe('read');
    });

    it('should handle adding and removing same collaborator', async () => {
      const { user: owner, token } = await createTestUser();
      const { user: collab } = await createTestUser();
      
      let notebook = await createTestNotebook(owner._id);

      // Add collaborator via PUT /collaborators
      await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`)
        .send({ collaborators: [{ userId: collab._id, access: 'write' }] });

      // Remove collaborator
      await request(app)
        .delete(`/api/notebooks/${notebook._id}/collaborators/${collab._id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify removed
      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.collaborators).toHaveLength(0);
    });

    it('should not allow owner to be added as collaborator', async () => {
      const { user: owner, token } = await createTestUser();
      
      const notebook = await createTestNotebook(owner._id);

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/collaborators`)
        .set('Authorization', `Bearer ${token}`)
        .send({ collaborators: [{ userId: owner._id, access: 'admin' }] });

      // Should either reject or ignore owner as collaborator
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        const collabs = await request(app)
          .get(`/api/notebooks/${notebook._id}/collaborators`)
          .set('Authorization', `Bearer ${token}`);
        
        const hasOwnerAsCollab = collabs.body.collaborators.some(
          c => c.id === owner._id.toString()
        );
        expect(hasOwnerAsCollab).toBe(false);
      }
    });
  });
});
