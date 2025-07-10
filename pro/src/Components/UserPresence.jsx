import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Tooltip,
  Typography,
  Badge,
  Fade,
  Paper,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Circle as CircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import socketClient from '../utils/socketClient';

const StyledBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: status === 'online' ? '#44b700' : status === 'typing' ? '#ff9800' : '#757575',
    color: status === 'online' ? '#44b700' : status === 'typing' ? '#ff9800' : '#757575',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: status === 'typing' ? 'ripple 1.2s infinite ease-in-out' : 'none',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const UserPresence = ({ notebookId, currentUser, activeUsers = [] }) => {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [expanded, setExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false });

  useEffect(() => {
    // Listen for typing events only
    const handleUserTyping = (data) => {
      setTypingUsers(prev => new Set([...prev, data.user.id]));
      
      // Auto-remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user.id);
          return newSet;
        });
      }, 3000);
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user.id);
        return newSet;
      });
    };

    const handleConnectionStatusChanged = (status) => {
      setConnectionStatus(status);
    };

    // Register event listeners
    socketClient.on('userTyping', handleUserTyping);
    socketClient.on('userStoppedTyping', handleUserStoppedTyping);
    socketClient.on('connectionStatusChanged', handleConnectionStatusChanged);

    // Cleanup
    return () => {
      socketClient.off('userTyping', handleUserTyping);
      socketClient.off('userStoppedTyping', handleUserStoppedTyping);
      socketClient.off('connectionStatusChanged', handleConnectionStatusChanged);
    };
  }, []);

  const getUserStatus = (userId) => {
    if (typingUsers.has(userId)) return 'typing';
    return 'online';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#44b700';
      case 'typing': return '#ff9800';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'typing': return 'Typing...';
      default: return 'Offline';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter out the current user from the active users list
  const displayedUsers = activeUsers.filter(user => {
    // If currentUser is undefined/null, don't filter anything
    if (!currentUser || !currentUser.id) return true;
    return user.id !== currentUser.id;
  });
  const visibleUsers = expanded ? displayedUsers : displayedUsers.slice(0, 3);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        minWidth: 280
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Active Users ({displayedUsers.length})
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={connectionStatus.connected ? 'Connected' : 'Disconnected'}>
            <CircleIcon 
              sx={{ 
                fontSize: 12, 
                color: connectionStatus.connected ? '#44b700' : '#f44336' 
              }} 
            />
          </Tooltip>
          
          {activeUsers.length > 3 && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ p: 0.5 }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {visibleUsers.map((user) => {
          const status = getUserStatus(user.id);
          return (
            <Fade key={user.id} in={true}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s ease'
                }}
              >
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  status={status}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      bgcolor: `hsl(${user.name.charCodeAt(0) * 10}, 70%, 50%)`
                    }}
                  >
                    {getInitials(user.name)}
                  </Avatar>
                </StyledBadge>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircleIcon
                      sx={{
                        fontSize: 8,
                        color: getStatusColor(status)
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: getStatusColor(status),
                        fontWeight: 500
                      }}
                    >
                      {getStatusText(status)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          );
        })}

        <Collapse in={expanded}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {displayedUsers.slice(3).map((user) => {
              const status = getUserStatus(user.id);
              return (
                <Box
                  key={user.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    status={status}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: `hsl(${user.name.charCodeAt(0) * 10}, 70%, 50%)`
                      }}
                    >
                      {getInitials(user.name)}
                    </Avatar>
                  </StyledBadge>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {user.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircleIcon
                        sx={{
                          fontSize: 8,
                          color: getStatusColor(status)
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: getStatusColor(status),
                          fontWeight: 500
                        }}
                      >
                        {getStatusText(status)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Collapse>

        {displayedUsers.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 2,
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2">
              No other users online
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default UserPresence;
