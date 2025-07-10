import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const PresenceContext = createContext();

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};

export const PresenceProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [currentUsers, setCurrentUsers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to presence server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from presence server');
      setIsConnected(false);
    });

    // Listen for user presence updates
    newSocket.on('userJoined', (userData) => {
      setCurrentUsers(prev => {
        const updated = new Map(prev);
        updated.set(userData.id, {
          ...userData,
          joinedAt: new Date(),
          lastSeen: new Date(),
        });
        return updated;
      });
    });

    newSocket.on('userLeft', (userId) => {
      setCurrentUsers(prev => {
        const updated = new Map(prev);
        updated.delete(userId);
        return updated;
      });
    });

    newSocket.on('usersInNotebook', (users) => {
      const usersMap = new Map();
      users.forEach(user => {
        usersMap.set(user.id, {
          ...user,
          joinedAt: new Date(user.joinedAt),
          lastSeen: new Date(user.lastSeen || user.joinedAt),
        });
      });
      setCurrentUsers(usersMap);
    });

    newSocket.on('userActivity', (userData) => {
      setCurrentUsers(prev => {
        const updated = new Map(prev);
        if (updated.has(userData.id)) {
          updated.set(userData.id, {
            ...updated.get(userData.id),
            ...userData,
            lastSeen: new Date(),
          });
        }
        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join a notebook room
  const joinNotebook = useCallback((notebookId, userInfo = null) => {
    if (!socket) return;

    // Get user info from localStorage or use provided info
    const token = localStorage.getItem('token');
    let user = userInfo;

    if (!user) {
      if (token) {
        // Try to get authenticated user info from token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          user = {
            id: payload.id,
            name: payload.name || 'Authenticated User',
            email: payload.email,
            isAuthenticated: true,
          };
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }

      // Generate anonymous user if no authentication
      if (!user) {
        const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const anonymousName = `Anonymous ${Math.floor(Math.random() * 1000)}`;
        user = {
          id: anonymousId,
          name: anonymousName,
          isAuthenticated: false,
          isAnonymous: true,
        };
      }
    }

    setCurrentUser(user);
    socket.emit('joinNotebook', { notebookId, user });
  }, [socket]);

  // Leave a notebook room
  const leaveNotebook = useCallback((notebookId) => {
    if (!socket || !currentUser) return;
    
    socket.emit('leaveNotebook', { notebookId, userId: currentUser.id });
    setCurrentUsers(new Map());
    setCurrentUser(null);
  }, [socket, currentUser]);

  // Send typing indicator
  const sendTyping = useCallback((notebookId, isTyping = true) => {
    if (!socket || !currentUser) return;
    
    socket.emit('userTyping', { 
      notebookId, 
      userId: currentUser.id, 
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }, [socket, currentUser]);

  // Send cursor position
  const sendCursorPosition = useCallback((notebookId, position) => {
    if (!socket || !currentUser) return;
    
    socket.emit('cursorPosition', { 
      notebookId, 
      userId: currentUser.id, 
      position,
      timestamp: new Date().toISOString(),
    });
  }, [socket, currentUser]);

  // Get users currently in the notebook
  const getUsersInNotebook = useCallback(() => {
    return Array.from(currentUsers.values());
  }, [currentUsers]);

  // Get user count
  const getUserCount = useCallback(() => {
    return currentUsers.size;
  }, [currentUsers]);

  // Check if user is typing
  const isUserTyping = useCallback((userId) => {
    const user = currentUsers.get(userId);
    return user?.isTyping || false;
  }, [currentUsers]);

  // Generate color for user (for cursors, highlights, etc.)
  const getUserColor = useCallback((userId) => {
    const colors = [
      '#6366f1', // Indigo
      '#06b6d4', // Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#f97316', // Orange
      '#ec4899', // Pink
      '#84cc16', // Lime
      '#14b8a6', // Teal
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const value = {
    socket,
    isConnected,
    currentUser,
    currentUsers: getUsersInNotebook(),
    userCount: getUserCount(),
    joinNotebook,
    leaveNotebook,
    sendTyping,
    sendCursorPosition,
    isUserTyping,
    getUserColor,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export default PresenceProvider;
