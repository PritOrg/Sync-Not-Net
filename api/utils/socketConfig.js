const config = require('../config');

const socketConfig = {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
  pingInterval: 25000,
  connectTimeout: 10000,
  transports: ['websocket'],
  allowUpgrades: false,
  maxConnections: 100,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  connectionHandler: (socket) => {
    const clientIp =
      socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const socketsByIp = Array.from(socket.nsp.sockets.values()).filter(
      (s) =>
        (s.handshake.headers['x-forwarded-for'] || s.handshake.address) ===
        clientIp
    );

    if (socketsByIp.length > config.socket.maxConnectionsPerIp) {
      socket.emit('error', { message: 'Too many connections from this IP' });
      socket.disconnect(true);
      return false;
    }

    return true;
  },
};

module.exports = socketConfig;
