const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('OK');
  });
});

describe('API Server', () => {
  it('should have app instance', () => {
    expect(app).toBeDefined();
  });

  it('should handle 404 for undefined routes', async () => {
    const response = await request(app)
      .get('/non-existent-route');

    expect(response.status).toBe(404);
  });
});
