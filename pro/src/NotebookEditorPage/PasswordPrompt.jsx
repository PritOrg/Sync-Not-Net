import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  Paper,
  Fade
} from '@mui/material';
import { Close, Lock, Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const PasswordPrompt = ({ 
  onSuccess, 
  notebookId, 
  onClose,
  requiresPassword = false,
  requiresGuestName = false,
  isAuthenticated = false
}) => {
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Step state: 'guestName' -> 'password' -> access
  const [step, setStep] = useState(requiresGuestName ? 'guestName' : 'password');

  useEffect(() => {
    setStep(requiresGuestName ? 'guestName' : 'password');
  }, [requiresGuestName]);
  
  const handleSubmit = async () => {
    if (step === 'guestName') {
      if (!guestName.trim()) {
        setError('Please enter your name');
        return;
      }
      setStep('password');
      setError('');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // If guest, send guestId and guestName
      const body = isAuthenticated ? { password } : { password, guestId: undefined, guestName: undefined };
      if (!isAuthenticated && guestName.trim()) {
        // Try to get guestId from local guestInfo if available
        let guestId = undefined;
        try {
          const guestInfo = JSON.parse(localStorage.getItem('guestInfo'));
          if (guestInfo && guestInfo.id) guestId = guestInfo.id;
        } catch {}
        body.guestId = guestId;
        body.guestName = guestName.trim();
      }

      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/verify-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (!isAuthenticated && guestName.trim()) {
          // Save guest info for socket connection
          if (data.guestUser) {
            localStorage.setItem('guestInfo', JSON.stringify(data.guestUser));
          }
          onSuccess(data, { guestName: guestName.trim() });
        } else {
          onSuccess(data);
        }
        Swal.fire({
          title: 'Access Granted!',
          text: 'Password verified successfully.',
          icon: 'success',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000,
        });
        setPassword('');
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setError('Error verifying password. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'password' && requiresGuestName) {
      setStep('guestName');
      setError('');
    }
  };

  if (!requiresPassword) return null;

  return (
    <Dialog 
      open 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxWidth: '400px',
          width: '100%',
          margin: 2
        }
      }}
    >
      <Paper elevation={0}>
        <Box sx={{ 
          position: 'relative', 
          padding: 4,
          background: 'linear-gradient(145deg, #ffffff, #f5f7fa)'
        }}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'text.secondary',
              '&:hover': {
                background: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            <Close />
          </IconButton>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 3
          }}>
            <Box sx={{ 
              background: step === 'guestName' 
                ? 'linear-gradient(45deg, #4caf50, #66bb6a)' 
                : 'linear-gradient(45deg, #2196f3, #1976d2)',
              borderRadius: '50%',
              p: 2,
              mb: 2
            }}>
              {step === 'guestName' ? (
                <PersonAdd sx={{ fontSize: 32, color: '#fff' }} />
              ) : (
                <Lock sx={{ fontSize: 32, color: '#fff' }} />
              )}
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                background: step === 'guestName' 
                  ? 'linear-gradient(45deg, #4caf50, #66bb6a)' 
                  : 'linear-gradient(45deg, #1976d2, #2196f3)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {step === 'guestName' ? 'Join Collaboration' : 'Protected Notebook'}
            </Typography>
          </Box>

          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 3, 
              textAlign: 'center',
              lineHeight: 1.6
            }}
          >
            {step === 'guestName' 
              ? 'Please enter your name to collaborate on this password-protected notebook.'
              : 'This notebook is password-protected. Please enter the password to access its contents.'
            }
          </Typography>

          <Fade in={true}>
            {step === 'guestName' ? (
              <TextField
                label="Your Name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyPress={handleKeyPress}
                error={Boolean(error)}
                helperText={error || "This name will be visible to other collaborators"}
                fullWidth
                variant="outlined"
                autoFocus
                placeholder="Enter your name"
                sx={{ mb: 3 }}
              />
            ) : (
              <TextField
                label="Enter Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                error={Boolean(error)}
                helperText={error}
                fullWidth
                variant="outlined"
                autoFocus
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
                sx={{ mb: 3 }}
              />
            )}
          </Fade>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: step === 'password' && requiresGuestName ? 'row' : 'column' }}>
            {step === 'password' && requiresGuestName && (
              <Button
                onClick={handleBack}
                variant="outlined"
                disabled={isVerifying}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  flex: 1
                }}
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isVerifying}
              fullWidth={!(step === 'password' && requiresGuestName)}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: step === 'guestName' 
                  ? 'linear-gradient(45deg, #4caf50, #66bb6a)' 
                  : 'linear-gradient(45deg, #1976d2, #2196f3)',
                textTransform: 'none',
                fontWeight: 600,
                flex: step === 'password' && requiresGuestName ? 1 : undefined
              }}
            >
              {isVerifying ? 'Verifying...' : (step === 'guestName' ? 'Continue' : 'Access Notebook')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Dialog>
  );
};

export default PasswordPrompt;