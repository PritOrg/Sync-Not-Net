import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Tooltip,
  Fade,
  Badge 
} from '@mui/material';
import { 
  Save as SaveIcon,
  AutoMode as AutoSaveIcon,
  CloudDone as CloudDoneIcon,
  CloudSync as CloudSyncIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const AutoSaveIndicator = ({
  isSaving,
  lastSavedTime,
  hasUnsavedChanges,
  autoSaveEnabled,
  connectionError,
  isConnected
}) => {
  const getStatusIcon = () => {
    if (connectionError || !isConnected) {
      return (
        <Tooltip title="Connection error">
          <ErrorIcon color="error" fontSize="small" />
        </Tooltip>
      );
    }
    
    if (isSaving) {
      return (
        <CircularProgress
          size={16}
          thickness={6}
          sx={{ color: theme => theme.palette.primary.main }}
        />
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <Tooltip title="Unsaved changes">
          <Badge color="warning" variant="dot">
            <SaveIcon fontSize="small" />
          </Badge>
        </Tooltip>
      );
    }

    return (
      <Tooltip title="All changes saved">
        <CloudDoneIcon color="success" fontSize="small" />
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

  return (
    <Fade in={true}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.5,
          px: 1,
          borderRadius: 1,
          bgcolor: theme => theme.palette.background.paper,
          border: theme => `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          minWidth: 150,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getStatusIcon()}
        </Box>
        
        <Typography
          variant="caption"
          sx={{ 
            color: theme => theme.palette.text.secondary,
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
                opacity: 0.7
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Fade>
  );
};

export default AutoSaveIndicator;