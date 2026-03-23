const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/userModel');
const Notebook = require('../models/notebookModel');
const NotebookVersion = require('../models/notebookVersionModel');

const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

async function login(email, password) {
  const response = await request(app)
    .post('/api/users/login')
    .send({ email, password });

  expect(response.status).toBe(200);
  return response.body.token;
}

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

beforeEach(async () => {
  await NotebookVersion.deleteMany({});
  await Notebook.deleteMany({});
  await User.deleteMany({});
});

describe('Notebook Version Endpoints', () => {
  it('allows owner to fetch a specific version', async () => {
    const ownerEmail = uniqueEmail('owner');
    const owner = await User.create({
      name: 'Owner User',
      email: ownerEmail,
      password: 'Test123!@#'
    });

    const notebook = await Notebook.create({
      title: 'Versioned Notebook',
      content: 'current-content',
      creatorID: owner._id,
      permissions: 'private',
      collaborators: [],
      urlIdentifier: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version: 2
    });

    const version = await NotebookVersion.create({
      notebookId: notebook._id,
      version: 1,
      content: 'old-content',
      createdBy: owner._id,
      changes: 'Initial version'
    });

    const token = await login(ownerEmail, 'Test123!@#');

    const response = await request(app)
      .get(`/api/notebooks/${notebook._id}/versions/${version._id}`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body.version).toHaveProperty('id', String(version._id));
    expect(response.body.version).toHaveProperty('version', 1);
    expect(response.body.version).toHaveProperty('content', 'old-content');
  });

  it('allows collaborator to fetch a specific version', async () => {
    const ownerEmail = uniqueEmail('owner');
    const collaboratorEmail = uniqueEmail('collab');

    const owner = await User.create({
      name: 'Owner User',
      email: ownerEmail,
      password: 'Test123!@#'
    });

    const collaborator = await User.create({
      name: 'Collaborator User',
      email: collaboratorEmail,
      password: 'Test123!@#'
    });

    const notebook = await Notebook.create({
      title: 'Collaborative Notebook',
      content: 'current-content',
      creatorID: owner._id,
      permissions: 'collaborators',
      collaborators: [{ userId: collaborator._id, access: 'read' }],
      urlIdentifier: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version: 3
    });

    const version = await NotebookVersion.create({
      notebookId: notebook._id,
      version: 2,
      content: 'collab-old-content',
      createdBy: owner._id,
      changes: 'Collaborative edit'
    });

    const collaboratorToken = await login(collaboratorEmail, 'Test123!@#');

    const response = await request(app)
      .get(`/api/notebooks/${notebook._id}/versions/${version._id}`)
      .set(authHeader(collaboratorToken));

    expect(response.status).toBe(200);
    expect(response.body.version).toHaveProperty('content', 'collab-old-content');
  });

  it('forbids non-owner restore and allows owner restore', async () => {
    const ownerEmail = uniqueEmail('owner');
    const collaboratorEmail = uniqueEmail('collab');

    const owner = await User.create({
      name: 'Owner User',
      email: ownerEmail,
      password: 'Test123!@#'
    });

    const collaborator = await User.create({
      name: 'Collaborator User',
      email: collaboratorEmail,
      password: 'Test123!@#'
    });

    const notebook = await Notebook.create({
      title: 'Restorable Notebook',
      content: 'current-content-to-backup',
      creatorID: owner._id,
      permissions: 'collaborators',
      collaborators: [{ userId: collaborator._id, access: 'write' }],
      urlIdentifier: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version: 5
    });

    const oldVersion = await NotebookVersion.create({
      notebookId: notebook._id,
      version: 3,
      content: 'restored-content',
      createdBy: owner._id,
      changes: 'Checkpoint'
    });

    const collaboratorToken = await login(collaboratorEmail, 'Test123!@#');
    const ownerToken = await login(ownerEmail, 'Test123!@#');

    const forbiddenResponse = await request(app)
      .post(`/api/notebooks/${notebook._id}/versions/${oldVersion._id}/restore`)
      .set(authHeader(collaboratorToken));

    expect(forbiddenResponse.status).toBe(403);

    const restoreResponse = await request(app)
      .post(`/api/notebooks/${notebook._id}/versions/${oldVersion._id}/restore`)
      .set(authHeader(ownerToken));

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body).toHaveProperty('message', 'Version restored successfully');
    expect(restoreResponse.body).toHaveProperty('version', 6);
    expect(restoreResponse.body).toHaveProperty('restoredVersion', 3);

    const updatedNotebook = await Notebook.findById(notebook._id);
    expect(updatedNotebook.content).toBe('restored-content');
    expect(updatedNotebook.version).toBe(6);

    const backupVersion = await NotebookVersion.findOne({
      notebookId: notebook._id,
      version: 5,
      changes: 'Auto-saved before restore'
    });

    expect(backupVersion).toBeTruthy();
    expect(backupVersion.content).toBe('current-content-to-backup');
  });
});
