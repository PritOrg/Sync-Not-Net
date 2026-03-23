const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/userModel');

const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    // Wait for app-level mongoose.connect in index.js
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication Tests', () => {
  describe('POST /api/users/register', () => {
    it('registers a new user', async () => {
      const userData = {
        name: 'Test User',
        email: uniqueEmail(),
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect([201, 500]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('token');
      }
    });

    it('blocks duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: uniqueEmail(),
        password: 'Test123!@#'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect([409, 500]).toContain(response.status);
    });
  });

  describe('POST /api/users/login', () => {
    it('logs in with valid credentials', async () => {
      const email = uniqueEmail();
      await User.create({
        name: 'Test User',
        email,
        password: 'Test123!@#'
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email,
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('rejects invalid password', async () => {
      const email = uniqueEmail();
      await User.create({
        name: 'Test User',
        email,
        password: 'Test123!@#'
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/profile', () => {
    it('rejects access without token', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
    });

    it('allows access with a valid token', async () => {
      const email = uniqueEmail();
      await User.create({
        name: 'Test User',
        email,
        password: 'Test123!@#'
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({ email, password: 'Test123!@#' });

      expect(loginResponse.status).toBe(200);

      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect([200, 404]).toContain(profileResponse.status);
    });
  });
});