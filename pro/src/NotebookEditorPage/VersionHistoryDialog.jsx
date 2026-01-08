import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Box,
  Chip,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Compare as CompareIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const VersionHistoryDialog = ({ open, onClose, notebookId, onVersionRestore, onCompareVersions }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Fetch version history on open
  useEffect(() => {
    if (open && notebookId) {
      fetchVersionHistory();
    }
  }, [open, notebookId]);

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedVersions([]);
    }
  }, [open]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/notebooks/${notebookId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVersions(response.data.versions || []);
    } catch (error) {
      console.error('Error fetching version history:', error);
      setError('Failed to load version history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVersion = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else {
        // Allow at most 2 selections for comparison
        if (prev.length < 2) {
          return [...prev, versionId];
        }
        return [prev[1], versionId]; // Remove oldest selection
      }
    });
  };

  const handleRestore = (versionId) => {
    if (onVersionRestore) {
      onVersionRestore(versionId);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      // Sort versions chronologically
      const sortedVersions = [...selectedVersions].sort((a, b) => {
        const versionA = versions.find(v => v.id === a);
        const versionB = versions.find(v => v.id === b);
        return new Date(versionA.createdAt) - new Date(versionB.createdAt);
      });
      
      onCompareVersions(sortedVersions[0], sortedVersions[1]);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: theme => theme.palette.primary.main,
        color: 'white',
        px: 3,
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">Version History</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : versions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No version history available for this notebook.
            </Typography>
          </Box>
        ) : (
          <>
            {selectedVersions.length > 0 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                borderBottom: theme => `1px solid ${theme.palette.divider}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {selectedVersions.length === 1 
                      ? '1 version selected' 
                      : `${selectedVersions.length} versions selected`}
                  </Typography>
                  {selectedVersions.length === 2 && (
                    <Button
                      startIcon={<CompareIcon />}
                      onClick={handleCompare}
                      color="primary"
                      variant="contained"
                      size="small"
                      sx={{ borderRadius: 1 }}
                    >
                      Compare Versions
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            <List sx={{ px: 0, py: 0 }}>
              {versions.map((version, index) => (
                <React.Fragment key={version.id}>
                  <ListItem 
                    button
                    selected={selectedVersions.includes(version.id)}
                    onClick={() => handleToggleVersion(version.id)}
                    sx={{
                      py: 2,
                      px: 3,
                      '&.Mui-selected': {
                        bgcolor: theme => `${theme.palette.primary.light}20`,
                        '&:hover': {
                          bgcolor: theme => `${theme.palette.primary.light}30`,
                        }
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Chip 
                        label={`v${version.version}`}
                        color={index === 0 ? "primary" : "default"} 
                        size="small"
                        variant={index === 0 ? "filled" : "outlined"}
                      />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" component="span" fontWeight={500}>
                            {index === 0 ? 'Current Version' : `Version ${version.version}`}
                          </Typography>
                          {index === 0 && (
                            <Chip 
                              label="Latest" 
                              color="success" 
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack direction="row" spacing={2} mt={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {version.createdBy?.name || 'Unknown'}
                            </Typography>
                          </Box>
                          {version.changes && (
                            <Typography variant="caption" color="textSecondary">
                              {version.changes}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Tooltip title="Restore to this version">
                        <IconButton 
                          edge="end" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version.id);
                          }}
                          color="primary"
                          size="small"
                          disabled={index === 0} // Disable for current version
                        >
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < versions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: theme => `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1 }}>
          Close
        </Button>
        <Button 
          onClick={fetchVersionHistory} 
          variant="contained" 
          startIcon={<HistoryIcon />}
          disabled={loading}
          sx={{ borderRadius: 1 }}
        >
          Refresh History
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;