import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

// API endpoint is handled by parent component via onSave

const PasswordSettingsDialog = ({ open, onClose, notebookId, initialSettings = {}, onSave }) => {
  const [password, setPassword] = useState('');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setIsPasswordEnabled(!!initialSettings.requiresPassword);
      setPassword('');
    }
  }, [open]);

  const handleTogglePasswordProtection = (event) => {
    setIsPasswordEnabled(event.target.checked);
    if (!event.target.checked) {
      setPassword('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSavePassword = async () => {
    if (isPasswordEnabled && !password.trim()) {
      setError('Password cannot be empty when protection is enabled');
      return;
    }
    
    if (isPasswordEnabled && password.trim().length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You need to be logged in to change password settings');
      }

      const settings = {
        password: isPasswordEnabled ? password.trim() : null,
        requiresPassword: isPasswordEnabled
      };

      console.log('Sending password settings:', { 
        ...settings, 
        password: settings.password ? '[REDACTED]' : null 
      });

      // Call the onSave function passed from parent
      const result = await onSave(settings);
      console.log('Password settings response:', result);
      setSuccess('Password settings updated successfully');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Password settings error:', error);
      setError(error.message || 'Failed to update password settings');
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
          bgcolor: '#f0fff4', 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid #d1fae5'
        }}>
          <LockIcon sx={{ color: '#047857' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#047857' }}>
            Password Protection
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
              Password protection adds an extra layer of security to your notebook. 
              Anyone who wants to access this notebook will need to enter the password.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Password protection applies to all access levels. Even if your notebook is public, 
                users will need to enter the password to view or edit it.
              </Typography>
            </Alert>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={isPasswordEnabled}
                onChange={handleTogglePasswordProtection}
                color="success"
              />
            }
            label={
              <Typography sx={{ fontWeight: 500 }}>
                {isPasswordEnabled ? 'Password protection enabled' : 'Password protection disabled'}
              </Typography>
            }
          />

          {isPasswordEnabled && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                fullWidth
                variant="outlined"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Please choose a strong password. Do not use easily guessable information.
              </Typography>
            </Box>
          )}
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
            onClick={handleSavePassword}
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? 'Saving...' : 'Save Password Settings'}
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

export default PasswordSettingsDialog;
