const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const router = express.Router();
const logger = require('../utils/logger');

// Initialize Redis client for health checks
const redisClient = new Redis(process.env.REDIS_URL);

router.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1;

    // Check Redis connection
    const redisStatus = await redisClient.ping() === 'PONG';

    // Check memory usage
    const usedMemory = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 500; // 500MB

    // Define health status
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
      },
      memory: {
        heapUsed: Math.round(usedMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(usedMemory.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(usedMemory.rss / 1024 / 1024) + 'MB'
      }
    };

    // Check if any critical service is down
    if (!mongoStatus || !redisStatus) {
      status.status = 'degraded';
    }

    // Check if memory usage is too high
    if (usedMemory.heapUsed > memoryThreshold) {
      status.status = 'warning';
      status.memory.warning = 'High memory usage detected';
    }

    // Set response status code based on health status
    const statusCode = status.status === 'healthy' ? 200 : 
                      status.status === 'degraded' ? 503 : 429;

    // Log health status if not healthy
    if (status.status !== 'healthy') {
      logger.warn('Health check failed:', status);
    }

    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

module.exports = router;