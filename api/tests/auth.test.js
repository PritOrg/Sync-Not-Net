const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/userModel');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Authentication Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      const password = await bcrypt.hash('Test123!@#', 10);
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should handle invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      const loginAttempt = () => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await loginAttempt();
      }

      const response = await loginAttempt();
      expect(response.status).toBe(423); // Locked
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Account is temporarily locked');
    });
  });

  describe('Protected Routes', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('Test123!@#', 10)
      });
      userId = user._id;
      token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'test-secret'
      );
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});