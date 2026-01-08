import React, { useState } from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Tooltip,
  Typography,
  Chip,
  Fade,
  Zoom,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { fadeIn, pulse, getAnimationStyles, getHoverTransform } from '../utils/animations';
import { usePresence } from '../contexts/PresenceContext';

const EnhancedUserPresence = ({ 
  notebookId, 
  userRole = 'viewer',
  showDetails = true,
  maxDisplayed = 4,
  size = 'medium'
}) => {
  const { currentUsers, userCount, currentUser, getUserColor } = usePresence();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    if (userCount > maxDisplayed) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <AdminIcon fontSize="small" />;
      case 'collaborator':
        return <EditIcon fontSize="small" />;
      default:
        return <VisibilityIcon fontSize="small" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return '#ef4444'; // Red
      case 'collaborator':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return { width: 28, height: 28 };
      case 'large':
        return { width: 44, height: 44 };
      default:
        return { width: 36, height: 36 };
    }
  };


  // Filter out the current user from the list
  const filteredUsers = currentUsers.filter(user => {
    if (!currentUser || !currentUser.id) return true;
    return user.id !== currentUser.id;
  });
  const displayedUsers = filteredUsers.slice(0, maxDisplayed);
  const remainingCount = Math.max(0, filteredUsers.length - maxDisplayed);

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        ...getAnimationStyles(fadeIn, 'normal'),
      }}
    >
      {showDetails && (
        <Fade in timeout={600}>
          <Chip
            icon={<PersonIcon />}
            label={`${userCount} online`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              borderColor: 'primary.main',
              color: 'primary.main',
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              ...getHoverTransform(1.05, -1),
            }}
          />
        </Fade>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <AvatarGroup
          max={maxDisplayed + 1}
          spacing={size === 'small' ? 'small' : 'medium'}
          sx={{
            '& .MuiAvatar-root': {
              border: '2px solid',
              borderColor: 'background.paper',
              ...getAvatarSize(),
              transition: 'all 0.3s ease-in-out',
              cursor: remainingCount > 0 ? 'pointer' : 'default',
              '&:hover': {
                transform: 'scale(1.1)',
                zIndex: 10,
              },
            },
          }}
          onClick={handleClick}
        >
          {displayedUsers.map((user, index) => (
            <Zoom
              key={user.id}
              in
              timeout={300 + index * 100}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <Tooltip
                title={
                  <Box sx={{ textAlign: 'center', py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {user.name}
                    </Typography>
                    {user.email && (
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {user.email}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                      {getRoleIcon(user.role || 'viewer')}
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                        {user.role || 'viewer'}
                      </Typography>
                    </Box>
                    {user.isAnonymous && (
                      <Typography variant="caption" sx={{ opacity: 0.6, fontStyle: 'italic' }}>
                        Anonymous user
                      </Typography>
                    )}
                  </Box>
                }
                placement="top"
                arrow
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    user.isTyping ? (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          animation: `${pulse} 1.5s ease-in-out infinite`,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: user.isAuthenticated ? '#10b981' : '#6b7280',
                        }}
                      />
                    )
                  }
                >
                  <Avatar
                    sx={{
                      backgroundColor: getUserColor(user.id),
                      color: 'white',
                      fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                      fontWeight: 600,
                      border: `2px solid ${getRoleColor(user.role || 'viewer')}`,
                      position: 'relative',
                    }}
                  >
                    {getInitials(user.name)}
                  </Avatar>
                </Badge>
              </Tooltip>
            </Zoom>
          ))}
        </AvatarGroup>

        {remainingCount > 0 && (
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              ml: 1,
              backgroundColor: 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected',
              },
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 280,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Online Users ({filteredUsers.length})
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List dense sx={{ py: 0 }}>
            {filteredUsers.map((user, index) => (
              <ListItem
                key={user.id}
                sx={{
                  px: 0,
                  py: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: user.isAuthenticated ? '#10b981' : '#6b7280',
                        }}
                      />
                    }
                  >
                    <Avatar
                      sx={{
                        backgroundColor: getUserColor(user.id),
                        color: 'white',
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(user.name)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {user.name}
                      </Typography>
                      {user.id === currentUser?.id && (
                        <Chip
                          label="You"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      {getRoleIcon(user.role || 'viewer')}
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                        {user.role || 'viewer'}
                      </Typography>
                      {user.isAnonymous && (
                        <>
                          <Typography variant="caption" sx={{ mx: 0.5 }}>
                            •
                          </Typography>
                          <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                            Anonymous
                          </Typography>
                        </>
                      )}
                      {user.isTyping && (
                        <>
                          <Typography variant="caption" sx={{ mx: 0.5 }}>
                            •
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'success.main',
                              fontWeight: 500,
                              animation: `${pulse} 1.5s ease-in-out infinite`,
                            }}
                          >
                            typing...
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Box>
  );
};

export default EnhancedUserPresence;
