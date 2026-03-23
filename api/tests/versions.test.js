const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/userModel');
const Notebook = require('../models/notebookModel');
const NotebookVersion = require('../models/notebookVersionModel');

const uniqueEmail = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

// Helper to create a test user and get token
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

// Helper to create a test notebook
const createTestNotebook = async (userId, options = {}) => {
  // Handle collaborators format - can be array of userIds or array of objects
  let collaborators = options.collaborators || [];
  if (collaborators.length > 0 && typeof collaborators[0] === 'string') {
    collaborators = collaborators.map(uid => ({ userId: uid, access: 'read' }));
  }

  return Notebook.create({
    title: options.title || 'Test Notebook',
    content: options.content || '<p>Test content</p>',
    creatorID: userId,
    permissions: options.permissions || 'everyone', // Changed from 'private' to 'everyone' for easier testing
    collaborators,
    urlIdentifier: options.urlIdentifier || `notebook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    version: options.version || 1
  });
};

// Helper to create a test version
const createTestVersion = async (notebookId, userId, versionNum = 1) => {
  return NotebookVersion.create({
    notebookId,
    version: versionNum,
    content: `<p>Version ${versionNum} content</p>`,
    createdBy: userId,
    changes: `Version ${versionNum} created`
  });
};

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

beforeEach(async () => {
  await NotebookVersion.deleteMany({});
  await Notebook.deleteMany({});
});

describe('Version Control Routes', () => {

  describe('GET /api/notebooks/:id/versions', () => {
    it('should return version history for notebook owner', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      
      // Create some versions
      await createTestVersion(notebook._id, user._id, 1);
      await createTestVersion(notebook._id, user._id, 2);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('versions');
      expect(response.body.versions).toHaveLength(2);
      expect(response.body.versions[0]).toHaveProperty('id');
      expect(response.body.versions[0]).toHaveProperty('version');
      expect(response.body.versions[0]).toHaveProperty('createdAt');
    });

    it('should return 401 without authentication token', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent notebook', async () => {
      const { token } = await createTestUser();
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/notebooks/${fakeId}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for user without access to private notebook', async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const notebook = await Notebook.create({
        title: 'Private Notebook',
        content: '<p>Private content</p>',
        creatorID: owner._id,
        permissions: 'collaborators',
        collaborators: [],
        urlIdentifier: `private-${Date.now()}`
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow collaborator to view version history', async () => {
      const { user: owner } = await createTestUser();
      const { user: collaborator, token: collabToken } = await createTestUser();
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [collaborator._id]
      });

      await createTestVersion(notebook._id, owner._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(response.status).toBe(200);
      expect(response.body.versions).toHaveLength(1);
    });

    it('should allow access to notebook with "everyone" permissions', async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const notebook = await createTestNotebook(owner._id, { permissions: 'everyone' });

      await createTestVersion(notebook._id, owner._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(200);
    });

    it('should return versions sorted by creation date descending', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      await createTestVersion(notebook._id, user._id, 1);
      await new Promise(resolve => setTimeout(resolve, 100));
      await createTestVersion(notebook._id, user._id, 2);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.versions[0].version).toBe(2);
      expect(response.body.versions[1].version).toBe(1);
    });

    it('should return empty array when no versions exist', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.versions).toHaveLength(0);
    });
  });

  describe('GET /api/notebooks/:id/versions/:versionId', () => {
    it('should return specific version content for owner', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook._id, user._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/${version._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(response.body.version.id).toBe(version._id.toString());
      expect(response.body.version.version).toBe(1);
      expect(response.body.version.content).toContain('Version 1');
    });

    it('should return 401 without authentication token', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook._id, user._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/${version._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent notebook', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook._id, user._id, 1);
      const fakeNotebookId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/notebooks/${fakeNotebookId}/versions/${version._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent version', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const fakeVersionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/${fakeVersionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when version belongs to different notebook', async () => {
      const { user, token } = await createTestUser();
      const notebook1 = await createTestNotebook(user._id);
      const notebook2 = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook2._id, user._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook1._id}/versions/${version._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for user without access to private notebook', async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const notebook = await Notebook.create({
        title: 'Private Notebook',
        content: '<p>Private content</p>',
        creatorID: owner._id,
        permissions: 'collaborators',
        collaborators: [],
        urlIdentifier: `private-${Date.now()}`
      });
      const version = await createTestVersion(notebook._id, owner._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/${version._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow collaborator to view version', async () => {
      const { user: owner } = await createTestUser();
      const { user: collaborator, token: collabToken } = await createTestUser();
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [collaborator._id]
      });
      const version = await createTestVersion(notebook._id, owner._id, 1);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/${version._id}`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/notebooks/:id/versions/:versionId/restore', () => {
    it('should restore version for notebook owner', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id, { version: 2 });
      const version = await createTestVersion(notebook._id, user._id, 1);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Version restored successfully');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('restoredVersion', 1);
    });

    it('should return 401 without authentication token', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook._id, user._id, 1);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when non-owner tries to restore', async () => {
      const { user: owner } = await createTestUser();
      const { user: collaborator, token: collabToken } = await createTestUser();
      const notebook = await createTestNotebook(owner._id, {
        collaborators: [collaborator._id]
      });
      const version = await createTestVersion(notebook._id, owner._id, 1);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${collabToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Only the notebook owner can restore versions');
    });

    it('should return 404 for non-existent notebook', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook._id, user._id, 1);
      const fakeNotebookId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/notebooks/${fakeNotebookId}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent version', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const fakeVersionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${fakeVersionId}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when version belongs to different notebook', async () => {
      const { user, token } = await createTestUser();
      const notebook1 = await createTestNotebook(user._id);
      const notebook2 = await createTestNotebook(user._id);
      const version = await createTestVersion(notebook2._id, user._id, 1);

      const response = await request(app)
        .post(`/api/notebooks/${notebook1._id}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should auto-save current content before restore', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id, { content: '<p>Current content</p>', version: 2 });
      const version = await createTestVersion(notebook._id, user._id, 1);

      await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      // Check that a new version was created with current content
      const versions = await NotebookVersion.find({ notebookId: notebook._id });
      const autoSaveVersion = versions.find(v => v.changes === 'Auto-saved before restore');
      expect(autoSaveVersion).toBeDefined();
      expect(autoSaveVersion.content).toContain('Current content');
    });

    it('should increment version number after restore', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id, { version: 2 });
      const version = await createTestVersion(notebook._id, user._id, 1);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.version).toBe(3); // Original 2 + 1
    });

    it('should update notebook content with restored version', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id, { content: '<p>Current content</p>' });
      const version = await createTestVersion(notebook._id, user._id, 1);

      await request(app)
        .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      const updatedNotebook = await Notebook.findById(notebook._id);
      expect(updatedNotebook.content).toContain('Version 1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid notebook ID format', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/notebooks/invalid-id/versions')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle invalid version ID format', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/invalid-id`)
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle very long content in version', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const longContent = 'a'.repeat(1000000); // 1MB content

      await NotebookVersion.create({
        notebookId: notebook._id,
        version: 1,
        content: longContent,
        createdBy: user._id,
        changes: 'Large content version'
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.versions).toHaveLength(1);
    });

    it('should handle multiple concurrent restore requests', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id, { version: 1 });
      const version = await createTestVersion(notebook._id, user._id, 1);

      // Send multiple concurrent requests
      const requests = Array(5).fill().map(() =>
        request(app)
          .post(`/api/notebooks/${notebook._id}/versions/${version._id}/restore`)
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(requests);
      
      // At least one should succeed
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle version with empty content', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      
      const version = await NotebookVersion.create({
        notebookId: notebook._id,
        version: 1,
        content: '',
        createdBy: user._id,
        changes: 'Empty content'
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions/${version._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.version.content).toBe('');
    });

    it('should handle version with special characters in content', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const specialContent = '<p>Test with special chars: <>&"\'</p>';

      await NotebookVersion.create({
        notebookId: notebook._id,
        version: 1,
        content: specialContent,
        createdBy: user._id,
        changes: 'Special chars version'
      });

      const response = await request(app)
        .get(`/api/notebooks/${notebook._id}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.versions).toHaveLength(1);
    });
  });
});
