import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Autocomplete,
  Chip,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const ACCESS_LEVELS = [
  { value: 'read', label: 'View Only', icon: <ViewIcon fontSize="small" />, color: '#6b7280' },
  { value: 'write', label: 'Can Edit', icon: <EditIcon fontSize="small" />, color: '#3b82f6' },
  { value: 'admin', label: 'Admin', icon: <AdminIcon fontSize="small" />, color: '#ef4444' }
];

const CollaboratorsSettingsDialog = ({ open, onClose, notebookId, initialSettings = {}, searchCollaborators, onSave }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      // Map collaborators to include access level
      const mappedCollaborators = (initialSettings.collaborators || []).map(c => ({
        _id: c._id || c.id || c.userId?._id,
        name: c.name || c.userId?.name || 'Unknown',
        email: c.email || c.userId?.email || '',
        access: c.access || 'write'
      }));
      setCollaborators(mappedCollaborators);
    }
  }, [open]);

  const handleCollaboratorSearch = async (searchTerm) => {
    if (searchTerm.length > 2) {
      try {
        const users = await searchCollaborators(searchTerm);
        setAvailableUsers(users || []);
      } catch (error) {
        console.error('Error searching collaborators:', error);
      }
    }
  };

  const addCollaborator = (user) => {
    if (user && !collaborators.find(c => c._id === (user._id || user.id))) {
      setCollaborators([...collaborators, {
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        access: 'write' // Default to write access
      }]);
    }
  };

  const removeCollaborator = async (userId) => {
    const collaborator = collaborators.find(c => c._id === userId);
    
    const result = await Swal.fire({
      title: 'Remove Collaborator?',
      text: `Are you sure you want to remove ${collaborator?.name || 'this user'} from the notebook?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      setCollaborators(collaborators.filter(c => c._id !== userId));
    }
  };

  const updateCollaboratorAccess = (userId, newAccess) => {
    setCollaborators(collaborators.map(c => 
      c._id === userId ? { ...c, access: newAccess } : c
    ));
  };

  const handleSaveCollaborators = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You need to be logged in to change collaborator settings');
      }

      const settings = {
        collaborators: collaborators.map(c => ({
          userId: c._id,
          access: c.access
        }))
      };

      // Call the onSave function passed from parent
      await onSave(settings);
      
      setSuccess('Collaborators updated successfully');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Failed to update collaborators');
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelInfo = (access) => {
    return ACCESS_LEVELS.find(a => a.value === access) || ACCESS_LEVELS[0];
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={loading ? null : onClose}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#fff5f5', 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid #fed7d7'
        }}>
          <PeopleIcon sx={{ color: '#e53e3e' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#e53e3e' }}>
            Manage Collaborators
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              Add collaborators to allow others to view and edit your notebook. Collaborators need an account on the platform.
            </Typography>
          </Box>

          <Autocomplete
            options={availableUsers}
            getOptionLabel={(option) => option.name || option.email || ''}
            onInputChange={(event, newInputValue) => {
              handleCollaboratorSearch(newInputValue);
            }}
            onChange={(event, newValue) => {
              if (newValue) {
                addCollaborator(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users by name or email"
                variant="outlined"
                placeholder="Type at least 3 characters to search"
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                  {option.name ? option.name[0].toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                </Box>
              </Box>
            )}
          />

          {collaborators.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Current collaborators ({collaborators.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {collaborators.map((collaborator) => {
                  const accessInfo = getAccessLevelInfo(collaborator.access);
                  return (
                    <Paper
                      key={collaborator._id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        borderRadius: 2
                      }}
                    >
                      <Avatar
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          fontSize: '0.875rem',
                          bgcolor: 'primary.main'
                        }}
                      >
                        {collaborator.name ? collaborator.name[0].toUpperCase() : 'U'}
                      </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {collaborator.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {collaborator.email}
                        </Typography>
                      </Box>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={collaborator.access}
                          onChange={(e) => updateCollaboratorAccess(collaborator._id, e.target.value)}
                          sx={{
                            '& .MuiSelect-select': {
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }
                          }}
                        >
                          {ACCESS_LEVELS.map((level) => (
                            <MenuItem key={level.value} value={level.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: level.color }}>
                                {level.icon}
                                <span>{level.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <Tooltip title="Remove collaborator">
                        <IconButton
                          size="small"
                          onClick={() => removeCollaborator(collaborator._id)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2, p: 3, borderRadius: 2, bgcolor: '#f9fafb', textAlign: 'center' }}>
              <Typography color="text.secondary">
                No collaborators added yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Search for users above to add them as collaborators
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Remember to set access permissions to "Collaborators only" 
              if you want to restrict access exclusively to the people added here.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button 
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCollaborators}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? 'Saving...' : 'Save Collaborators'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">{success}</Alert>
      </Snackbar>
    </>
  );
};

export default CollaboratorsSettingsDialog;
