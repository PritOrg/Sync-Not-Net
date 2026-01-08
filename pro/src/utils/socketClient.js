import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;  // Reduced from 5 to 3
    this.reconnectDelay = 2000;     // Increased from 1000 to 2000
    this.currentNotebook = null;
    this.eventListeners = new Map();
    this.lastError = null;
    this.connectionLock = false;     // Add connection lock to prevent multiple simultaneous connections
  }

  connect(token, guestInfo = null) {
    // Return existing connection if active
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.connectionLock) {
      console.log('Connection attempt in progress, skipping...');
      return null;
    }

    this.connectionLock = true;
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    // Clear any existing socket instance
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    const authConfig = {};
    if (token) {
      authConfig.token = token;
    } else if (guestInfo) {
      authConfig.guestInfo = guestInfo;
    }
    
    this.socket = io(API_BASE_URL, {
      auth: authConfig,
      transports: ['websocket'],  // Only use websocket, remove polling
      timeout: 10000,            // Reduced timeout
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      extraHeaders: {            // Add headers for better connection handling
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.lastError = null;
      this.emit('connectionStatusChanged', { connected: true });

      // Rejoin notebook if we were in one
      if (this.currentNotebook) {
        this.joinNotebook(this.currentNotebook);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connectionStatusChanged', { connected: false, reason });
      
      if (reason === 'io server disconnect') {
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.lastError = error;
      this.emit('connectionError', { error, attempts: this.reconnectAttempts });
      this.handleReconnection();
    });

    // Notebook-specific events with improved error handling
    this.socket.on('joinedNotebook', (data) => {
      console.log('Joined notebook:', data);
      this.currentNotebook = data.notebookId;
      this.emit('joinedNotebook', data);
    });

    this.socket.on('userJoined', (data) => {
      console.log('User joined:', data);
      this.emit('userJoined', data);
    });

    this.socket.on('userLeft', (data) => {
      console.log('User left:', data);
      this.emit('userLeft', data);
    });

    this.socket.on('notebookUpdated', (data) => {
      console.log('Notebook updated:', data);
      this.emit('notebookUpdated', data);
    });

    this.socket.on('updateConfirmed', (data) => {
      console.log('Update confirmed:', data);
      this.emit('updateConfirmed', data);
    });

    this.socket.on('conflictDetected', (data) => {
      console.log('Conflict detected:', data);
      this.emit('conflictDetected', data);
    });

    this.socket.on('userTyping', (data) => {
      this.emit('userTyping', data);
    });

    this.socket.on('userStoppedTyping', (data) => {
      this.emit('userStoppedTyping', data);
    });

    this.socket.on('userCursorPosition', (data) => {
      this.emit('userCursorPosition', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.lastError = error;
      this.emit('error', error);
    });
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connectionError', { 
        error: new Error('Failed to reconnect after maximum attempts'),
        attempts: this.reconnectAttempts,
        final: true
      });
      this.connectionLock = false; // Release connection lock
      
      // Clean up the socket instance
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        // Clean up before attempting to reconnect
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
        this.connectionLock = false;
        // Attempt a fresh connection
        this.connect(this.socket?.auth?.token);
      }
    }, delay);
  }

  joinNotebook(notebookId, guestInfo = null) {
    if (!this.isConnected) {
      console.warn('Cannot join notebook: socket not connected');
      return;
    }
    // Accept both string and object, but always send notebookId as a string
    const id = typeof notebookId === 'object' && notebookId.notebookId ? notebookId.notebookId : notebookId;
    console.log('Joining notebook:', id, guestInfo ? 'as guest' : 'as user');
    if (guestInfo) {
      this.socket.emit('joinNotebook', id, guestInfo);
    } else {
      this.socket.emit('joinNotebook', id);
    }
  }

  updateNotebook(data) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('updateNotebook', data);
    return true;
  }

  startTyping(notebookId) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('typing', { notebookId });
    return true;
  }

  stopTyping(notebookId) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('stopTyping', { notebookId });
    return true;
  }

  sendCursorPosition(notebookId, position) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('cursorPosition', { notebookId, position });
    return true;
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentNotebook = null;
      this.eventListeners.clear();
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      currentNotebook: this.currentNotebook
    };
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;
