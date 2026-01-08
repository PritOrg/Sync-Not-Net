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
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  People as PeopleIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const CollaboratorsSettingsDialog = ({ open, onClose, notebookId, initialSettings = {}, searchCollaborators, onSave }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setCollaborators(initialSettings.collaborators || []);
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
    if (user && !collaborators.find(c => (c._id || c.id || c) === (user._id || user.id))) {
      setCollaborators([...collaborators, user]);
    }
  };

  const removeCollaborator = (userId) => {
    setCollaborators(collaborators.filter(c => (c._id || c.id || c) !== userId));
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
          userId: c._id || c.id || c,
          access: 'write' // Default to write access for now
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
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Current collaborators:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {collaborators.map((collaborator, index) => (
                  <Chip
                    key={collaborator._id || collaborator.id || index}
                    avatar={
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                        {collaborator.name ? collaborator.name[0].toUpperCase() : 'U'}
                      </Avatar>
                    }
                    label={collaborator.name || collaborator.email || 'Unknown'}
                    onDelete={() => removeCollaborator(collaborator._id || collaborator.id || collaborator)}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
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
