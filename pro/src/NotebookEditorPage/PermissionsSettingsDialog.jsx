import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Public as PublicIcon,
  People as PeopleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const PermissionsSettingsDialog = ({ open, onClose, notebookId, initialSettings = {}, onSave }) => {
  const [permissions, setPermissions] = useState('everyone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setPermissions(initialSettings.permissions || 'everyone');
    }
  }, [open]);

  const handlePermissionsChange = (event) => {
    setPermissions(event.target.value);
  };

  const handleSavePermissions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You need to be logged in to change access settings');
      }

      const settings = {
        permissions
      };

      // Call the onSave function passed from parent
      await onSave(settings);
      
      setSuccess('Access settings updated successfully');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Failed to update access settings');
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
          bgcolor: '#eff6ff', 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid #dbeafe'
        }}>
          <PublicIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2563eb' }}>
            Access Permissions
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
              Control who can access and edit your notebook. Choose the appropriate permission level for your needs.
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Who can access</InputLabel>
            <Select
              value={permissions}
              onChange={handlePermissionsChange}
              label="Who can access"
            >
              <MenuItem value="everyone">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PublicIcon sx={{ fontSize: 20 }} />
                  <Typography>Public - Anyone can view and edit</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="collaborators">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon sx={{ fontSize: 20 }} />
                  <Typography>Collaborators only</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon sx={{ fontSize: 20 }} />
                  <Typography>Private - Only me</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Password protection settings are separate and can be used with any access level for additional security.
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
            onClick={handleSavePermissions}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? 'Saving...' : 'Save Access Settings'}
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

export default PermissionsSettingsDialog;
