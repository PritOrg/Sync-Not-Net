require('dotenv').config();
const validateEnv = require('./utils/validateEnv');
const Sentry = require('@sentry/node');

// Validate environment variables before starting
validateEnv();

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  });
}

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

// Import middleware
const { verifyToken } = require('./middlewares/verifyToken');
const { securityMiddleware, generalLimiter, authLimiter } = require('./middlewares/security');
const { globalErrorHandler, notFound } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Import models
const Notebook = require('./models/notebookModel');

// Import routes
const userRoutes = require('./routes/userRoutes');
const notebookRoutes = require('./routes/notebookRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const ioConfig = {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
};

// Initialize Redis for Socket.IO in production
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  try {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();

    // Add error handlers
    pubClient.on('error', (err) => {
      logger.error('Redis Pub Client Error:', err);
    });
    
    subClient.on('error', (err) => {
      logger.error('Redis Sub Client Error:', err);
    });

    ioConfig.adapter = createAdapter(pubClient, subClient);
    logger.info('Redis adapter configured for Socket.IO');
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
  }
} else {
  logger.info('Running without Redis in development mode');
}

// Initialize Socket.IO with config
const io = socketIo(server, ioConfig);


// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(securityMiddleware);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', generalLimiter);
// Enable stricter rate limiting for auth endpoints in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/register', authLimiter);
}

// MongoDB connection with enhanced options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-not-net', {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}).then(() => {
  logger.info('MongoDB Connected successfully');
}).catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/users', userRoutes);
// All notebook routes with optional authentication - supports both public and authenticated access
app.use('/api/notebooks', (req, res, next) => {
  // Allow unauthenticated GET access for /:urlIdentifier/access and /:urlIdentifier
  if (req.method === 'GET' && (/^\/[^/]+\/access$/.test(req.path) || /^\/[^/]+$/.test(req.path))) {
    return notebookRoutes(req, res, next);
  }
  // Allow unauthenticated PUT/POST for public notebook updates (will be validated in route)
  if ((req.method === 'PUT' || req.method === 'POST') && /^\/[^/]+$/.test(req.path)) {
    return notebookRoutes(req, res, next);
  }
  // Allow unauthenticated POST for guest registration and password verification
  if (req.method === 'POST' && (/^\/[^/]+\/register-guest$/.test(req.path) || /^\/[^/]+\/verify-password$/.test(req.path))) {
    return notebookRoutes(req, res, next);
  }
  // Otherwise require token for authenticated routes
  return verifyToken(req, res, next);
}, notebookRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Enhanced Socket.io with authentication and better error handling
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

// Store active users and their sessions
const activeUsers = new Map(); // socketId -> { userId, notebookId, userInfo }
const notebookUsers = new Map(); // notebookId -> Set of socketIds
const typingUsers = new Map(); // notebookId -> Set of userIds
// Track connections per IP to avoid socket DoS
const ipConnections = new Map(); // ip -> count
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.SOCKET_MAX_CONNECTIONS_PER_IP || '10', 10);

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    // Simple per-IP connection limit
    const ip = socket.handshake.address || socket.conn.remoteAddress || 'unknown';
    const current = ipConnections.get(ip) || 0;
    if (current >= MAX_CONNECTIONS_PER_IP) {
      return next(new Error('Too many connections from this IP'));
    }
    ipConnections.set(ip, current + 1);

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    const guestInfo = socket.handshake.auth.guestInfo;
    
    if (!token && !guestInfo) {
      // Allow anonymous/guest connections without any info
      socket.userId = null;
      socket.userInfo = {
        id: null,
        name: 'Anonymous',
        email: null,
        role: 'anonymous'
      };
      return next();
    }

    if (guestInfo && guestInfo.id && guestInfo.name) {
      // Handle guest user
      socket.userId = guestInfo.id;
      socket.userInfo = {
        id: guestInfo.id,
        name: guestInfo.name,
        email: null,
        role: 'guest'
      };
      return next();
    }

    if (token) {
      // Handle authenticated user
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-change-in-production');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.userInfo = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    }

    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`User ${socket.userInfo.name} connected with socket ${socket.id}`);

  // Join notebook room with enhanced validation
  socket.on('joinNotebook', async (notebookId, guestInfo) => {
    try {
      // Accept notebookId as object or string
      let id = notebookId;
      if (typeof notebookId === 'object' && notebookId.notebookId) {
        id = notebookId.notebookId;
      }

      // Validate notebook access
      const notebook = await Notebook.findById(id);
      if (!notebook) {
        socket.emit('error', { message: 'Notebook not found' });
        return;
      }

      // Check if user has access to this notebook
      const isAuthenticated = socket.userInfo.role !== 'guest' && socket.userInfo.role !== 'anonymous';
      const hasAccess = isAuthenticated ? (
        notebook.creatorID.toString() === socket.userId ||
        (Array.isArray(notebook.collaborators) && notebook.collaborators.some(c => c.toString() === socket.userId)) ||
        notebook.permissions === 'everyone'
      ) : (
        notebook.permissions === 'everyone' && !notebook.password
      );

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this notebook' });
        return;
      }

      // Leave previous notebook room if any
      const previousSession = activeUsers.get(socket.id);
      if (previousSession) {
        socket.leave(previousSession.notebookId);
        const prevNotebookUsers = notebookUsers.get(previousSession.notebookId);
        if (prevNotebookUsers) {
          prevNotebookUsers.delete(socket.id);
          if (prevNotebookUsers.size === 0) {
            notebookUsers.delete(previousSession.notebookId);
          }
        }
      }

      // Join new notebook room
      socket.join(id);

      // Update user session
      activeUsers.set(socket.id, {
        userId: socket.userId,
        notebookId: id,
        userInfo: socket.userInfo,
        joinedAt: new Date()
      });

      // Update notebook users
      if (!notebookUsers.has(id)) {
        notebookUsers.set(id, new Set());
      }
      notebookUsers.get(id).add(socket.id);

      // Get current users in the notebook (include all, including self, and always include guest name if present)
      const currentUsers = Array.from(notebookUsers.get(id))
        .map(socketId => activeUsers.get(socketId))
        .filter(user => user && user.userInfo && user.userInfo.name)
        .map(user => ({
          id: user.userInfo.id,
          name: user.userInfo.name,
          role: user.userInfo.role || 'unknown',
          email: user.userInfo.email || null,
          joinedAt: user.joinedAt || null
        }));

      // Notify user of successful join and current users
      socket.emit('joinedNotebook', {
        notebookId: id,
        currentUsers,
        message: 'Successfully joined notebook'
      });

      // Broadcast to others that a new user joined
      socket.to(id).emit('userJoined', {
        user: {
          id: socket.userInfo.id,
          name: socket.userInfo.name,
          role: socket.userInfo.role || 'unknown',
          email: socket.userInfo.email || null,
          joinedAt: new Date()
        },
        timestamp: new Date()
      });

      logger.info(`User ${socket.userInfo.name} (${socket.userInfo.role}) joined notebook ${id}`);
    } catch (error) {
      logger.error('Error joining notebook:', error);
      socket.emit('error', { message: 'Failed to join notebook' });
    }
  });

  // Enhanced notebook update with conflict resolution
  socket.on('updateNotebook', async (data) => {
    try {
      const { notebookId, content, title, version } = data;
      const userSession = activeUsers.get(socket.id);

      if (!userSession || userSession.notebookId !== notebookId) {
        socket.emit('error', { message: 'Not joined to this notebook' });
        return;
      }

      const notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        socket.emit('error', { message: 'Notebook not found' });
        return;
      }

      // Check if user can edit this notebook
      const isAuthenticated = socket.userInfo.role !== 'guest' && socket.userInfo.role !== 'anonymous';
      const canEdit = isAuthenticated ? (
        notebook.creatorID.toString() === socket.userId ||
        notebook.collaborators.includes(socket.userId) ||
        notebook.permissions === 'everyone'
      ) : (
        notebook.permissions === 'everyone' && !notebook.password
      );

      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to edit this notebook' });
        return;
      }

      // Simple version conflict detection
      if (version && notebook.version > version) {
        socket.emit('conflictDetected', {
          serverVersion: notebook.version,
          serverContent: notebook.content,
          serverTitle: notebook.title
        });
        return;
      }

      // Update notebook
      if (title !== undefined) notebook.title = title;
      if (content !== undefined) notebook.content = content;
      notebook.version += 1;
      notebook.updatedAt = new Date();

      await notebook.save();

      // Broadcast update to all users in the room except sender
      socket.to(notebookId).emit('notebookUpdated', {
        notebookId,
        title: notebook.title,
        content: notebook.content,
        version: notebook.version,
        updatedBy: socket.userInfo,
        timestamp: new Date()
      });

      // Confirm update to sender
      socket.emit('updateConfirmed', {
        version: notebook.version,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error updating notebook:', error);
      socket.emit('error', { message: 'Failed to update notebook' });
    }
  });

  // Enhanced typing indicators
  socket.on('typing', ({ notebookId }) => {
    const userSession = activeUsers.get(socket.id);
    if (!userSession || userSession.notebookId !== notebookId) return;

    if (!typingUsers.has(notebookId)) {
      typingUsers.set(notebookId, new Set());
    }
    typingUsers.get(notebookId).add(socket.userId);

    socket.to(notebookId).emit('userTyping', {
      user: socket.userInfo,
      timestamp: new Date()
    });
  });

  socket.on('stopTyping', ({ notebookId }) => {
    const userSession = activeUsers.get(socket.id);
    if (!userSession || userSession.notebookId !== notebookId) return;

    const notebookTypingUsers = typingUsers.get(notebookId);
    if (notebookTypingUsers) {
      notebookTypingUsers.delete(socket.userId);
      if (notebookTypingUsers.size === 0) {
        typingUsers.delete(notebookId);
      }
    }

    socket.to(notebookId).emit('userStoppedTyping', {
      user: socket.userInfo,
      timestamp: new Date()
    });
  });

  // Handle cursor position sharing
  socket.on('cursorPosition', ({ notebookId, position }) => {
    const userSession = activeUsers.get(socket.id);
    if (!userSession || userSession.notebookId !== notebookId) return;

    socket.to(notebookId).emit('userCursorPosition', {
      user: socket.userInfo,
      position,
      timestamp: new Date()
    });
  });

  // Enhanced disconnect handling
  socket.on('disconnect', (reason) => {
    const userSession = activeUsers.get(socket.id);
    // Decrement IP connection count
    try {
      const ip = socket.handshake.address || (socket.conn && socket.conn.remoteAddress) || 'unknown';
      const curr = ipConnections.get(ip) || 0;
      if (curr <= 1) ipConnections.delete(ip); else ipConnections.set(ip, curr - 1);
    } catch (e) {
      // ignore
    }
    if (userSession) {
      const { notebookId, userInfo } = userSession;

      // Remove from active users
      activeUsers.delete(socket.id);

      // Remove from notebook users
      const notebookUserSet = notebookUsers.get(notebookId);
      if (notebookUserSet) {
        notebookUserSet.delete(socket.id);
        if (notebookUserSet.size === 0) {
          notebookUsers.delete(notebookId);
        }
      }

      // Remove from typing users
      const notebookTypingUsers = typingUsers.get(notebookId);
      if (notebookTypingUsers) {
        notebookTypingUsers.delete(socket.userId);
        if (notebookTypingUsers.size === 0) {
          typingUsers.delete(notebookId);
        }
      }

      // Notify others in the notebook
      socket.to(notebookId).emit('userLeft', {
        user: userInfo,
        reason,
        timestamp: new Date()
      });

      logger.info(`User ${userInfo.name} disconnected from notebook ${notebookId}. Reason: ${reason}`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${socket.userInfo.name}:`, error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
