const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/userModel');

const uniqueEmail = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Routes Baseline', () => {
  it('rejects profile access without token', async () => {
    const response = await request(app).get('/api/users/profile');
    expect(response.status).toBe(401);
  });

  it('returns profile for authenticated user', async () => {
    const email = uniqueEmail();
    await User.create({
      name: 'Profile User',
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

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body).toHaveProperty('email', email);
  });

  it('validates search query length', async () => {
    const email = uniqueEmail();
    await User.create({
      name: 'Search User',
      email,
      password: 'Test123!@#'
    });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email, password: 'Test123!@#' });

    expect(loginResponse.status).toBe(200);

    const searchResponse = await request(app)
      .get('/api/users/search?q=a')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(searchResponse.status).toBe(400);
  });

  it('returns stats object for authenticated user', async () => {
    const email = uniqueEmail();
    await User.create({
      name: 'Stats User',
      email,
      password: 'Test123!@#'
    });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email, password: 'Test123!@#' });

    expect(loginResponse.status).toBe(200);

    const statsResponse = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body).toHaveProperty('stats');
  });
});
