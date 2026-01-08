import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Tooltip,
  Fade,
  Badge,
  keyframes
} from '@mui/material';
import { 
  Save as SaveIcon,
  AutoMode as AutoSaveIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

// Define keyframes for animations
const pulseAnimation = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0px); }
`;

const spinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const AutoSaveIndicator = ({
  isSaving,
  lastSavedTime,
  hasUnsavedChanges,
  autoSaveEnabled,
  connectionError,
  isConnected
}) => {
  // Add a visual pulse effect when saving state changes
  const [showPulse, setShowPulse] = useState(false);
  
  useEffect(() => {
    if (isSaving) {
      setShowPulse(true);
    } else if (hasUnsavedChanges === false) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSaving, hasUnsavedChanges]);
  
  const getStatusIcon = () => {
    if (connectionError || !isConnected) {
      return (
        <Tooltip title="Connection error - Changes won't be saved">
          <ErrorIcon 
            color="error" 
            fontSize="small" 
            sx={{ 
              animation: `${pulseAnimation} 1.5s ease-in-out infinite`,
            }} 
          />
        </Tooltip>
      );
    }
    
    if (isSaving) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: 18,
            height: 18,
          }}
        >
          <CircularProgress
            size={18}
            thickness={5}
            sx={{ 
              color: theme => theme.palette.primary.main,
              position: 'absolute',
            }}
          />
          <CloudSyncIcon 
            fontSize="small" 
            sx={{ 
              color: theme => theme.palette.primary.main,
              opacity: 0.7,
              fontSize: '0.9rem',
              animation: `${spinnerAnimation} 2s linear infinite`,
            }} 
          />
        </Box>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <Tooltip title="Unsaved changes">
          <Badge 
            color="warning" 
            variant="dot"
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                animation: `${pulseAnimation} 2s ease-in-out infinite`,
              }
            }}
          >
            <SaveIcon 
              fontSize="small"
              sx={{ color: theme => theme.palette.warning.main }}
            />
          </Badge>
        </Tooltip>
      );
    }

    return (
      <Tooltip title="All changes saved">
        <CloudDoneIcon 
          color="success" 
          fontSize="small" 
          sx={{ 
            animation: showPulse 
              ? `${floatAnimation} 0.8s ease-in-out` 
              : 'none',
          }}
        />
      </Tooltip>
    );
  };

  const getStatusText = () => {
    if (connectionError) return 'Connection error';
    if (!isConnected) return 'Offline';
    if (isSaving) return 'Saving...';
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastSavedTime) {
      const timeAgo = getTimeAgo(lastSavedTime);
      return `Last saved ${timeAgo}`;
    }
    return 'All changes saved';
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return 'a minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'an hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return new Date(date).toLocaleString();
  };

  // Get appropriate background color based on status
  const getBackgroundColor = () => {
    if (connectionError || !isConnected) return 'rgba(211, 47, 47, 0.08)'; // Error red
    if (isSaving) return 'rgba(25, 118, 210, 0.08)'; // Primary blue
    if (hasUnsavedChanges) return 'rgba(237, 108, 2, 0.08)'; // Warning orange
    return 'rgba(46, 125, 50, 0.08)'; // Success green
  };

  // Get appropriate border color based on status
  const getBorderColor = () => {
    if (connectionError || !isConnected) return 'rgba(211, 47, 47, 0.2)'; // Error red
    if (isSaving) return 'rgba(25, 118, 210, 0.2)'; // Primary blue
    if (hasUnsavedChanges) return 'rgba(237, 108, 2, 0.2)'; // Warning orange
    return 'rgba(46, 125, 50, 0.2)'; // Success green
  };
  
  return (
    <Fade in={true}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.6,
          px: 1.5,
          borderRadius: 2,
          bgcolor: getBackgroundColor,
          border: theme => `1px solid ${getBorderColor()}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          minWidth: 150,
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          '&::after': isSaving ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: theme => `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
            animation: `${pulseAnimation} 1.5s infinite ease-in-out`,
          } : {},
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: 20, // Fixed width to prevent layout shifts
            justifyContent: 'center'
          }}
        >
          {getStatusIcon()}
        </Box>
        
        <Typography
          variant="caption"
          sx={{ 
            fontWeight: isSaving || hasUnsavedChanges ? 500 : 400,
            color: theme => {
              if (connectionError || !isConnected) return theme.palette.error.main;
              if (isSaving) return theme.palette.primary.main;
              if (hasUnsavedChanges) return theme.palette.warning.dark;
              return theme.palette.success.dark;
            },
            whiteSpace: 'nowrap'
          }}
        >
          {getStatusText()}
        </Typography>

        {autoSaveEnabled && (
          <Tooltip title="Auto-save enabled">
            <AutoSaveIcon
              fontSize="small"
              sx={{
                ml: 'auto',
                color: theme => theme.palette.success.main,
                opacity: 0.8,
                animation: `${floatAnimation} 3s ease-in-out infinite`
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Fade>
  );
};

export default AutoSaveIndicator;