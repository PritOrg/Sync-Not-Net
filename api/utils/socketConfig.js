const socketConfig = {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 20000,
  pingInterval: 25000,
  connectTimeout: 10000,
  transports: ["websocket"],
  allowUpgrades: false,
  maxConnections: 100,
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 connections per windowMs
  },
  // Connection handling
  connectionHandler: (socket) => {
    let connectedSockets = socket.nsp.sockets.size;
    
    // Implement connection limits per IP
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const socketsByIp = Array.from(socket.nsp.sockets.values())
      .filter(s => (s.handshake.headers['x-forwarded-for'] || s.handshake.address) === clientIp);
    
    if (socketsByIp.length > 5) { // Max 5 connections per IP
      socket.emit('error', { message: 'Too many connections from this IP' });
      socket.disconnect(true);
      return false;
    }

    return true;
  }
};

module.exports = socketConfig;