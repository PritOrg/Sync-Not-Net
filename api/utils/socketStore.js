const Redis = require('ioredis');
const logger = require('./logger');

class SocketStore {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  // Key prefixes for different types of data
  static keys = {
    userConnection: 'socket:user:',
    notebookUsers: 'socket:notebook:',
    ipConnections: 'socket:ip:',
  };

  // User presence management
  async addUserToNotebook(notebookId, userId, socketId) {
    const key = SocketStore.keys.notebookUsers + notebookId;
    await this.redis.hset(key, userId, socketId);
    // Set expiry to clean up if process crashes
    await this.redis.expire(key, 24 * 60 * 60); // 24 hours
  }

  async removeUserFromNotebook(notebookId, userId) {
    const key = SocketStore.keys.notebookUsers + notebookId;
    await this.redis.hdel(key, userId);
  }

  async getNotebookUsers(notebookId) {
    const key = SocketStore.keys.notebookUsers + notebookId;
    return this.redis.hgetall(key);
  }

  // IP-based connection limiting
  async incrementIpConnections(ip) {
    const key = SocketStore.keys.ipConnections + ip;
    const count = await this.redis.incr(key);
    await this.redis.expire(key, 60 * 60); // 1 hour expiry
    return count;
  }

  async decrementIpConnections(ip) {
    const key = SocketStore.keys.ipConnections + ip;
    return this.redis.decr(key);
  }

  async getIpConnections(ip) {
    const key = SocketStore.keys.ipConnections + ip;
    const count = await this.redis.get(key);
    return parseInt(count) || 0;
  }

  // User socket mapping
  async setUserSocket(userId, socketId) {
    const key = SocketStore.keys.userConnection + userId;
    await this.redis.set(key, socketId);
    await this.redis.expire(key, 24 * 60 * 60); // 24 hours
  }

  async removeUserSocket(userId) {
    const key = SocketStore.keys.userConnection + userId;
    await this.redis.del(key);
  }

  async getUserSocket(userId) {
    const key = SocketStore.keys.userConnection + userId;
    return this.redis.get(key);
  }

  // Cleanup methods
  async clearNotebookUsers(notebookId) {
    const key = SocketStore.keys.notebookUsers + notebookId;
    await this.redis.del(key);
  }

  // Health check
  async ping() {
    return this.redis.ping();
  }
}

module.exports = new SocketStore();