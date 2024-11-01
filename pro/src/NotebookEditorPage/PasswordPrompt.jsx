import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  Paper,
  Fade
} from '@mui/material';
import { Close, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2';

const PasswordPrompt = ({ onSuccess, hashedPassword, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (isMatch) {
      setError('');
      onSuccess();
      Swal.fire({
        title: 'Access Granted!',
        text: 'Password matches, you can now access the notebook.',
        icon: 'success',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 5000,
      });
      setPassword('');
      onClose();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

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
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              borderRadius: '50%',
              p: 2,
              mb: 2
            }}>
              <Lock sx={{ fontSize: 32, color: '#fff' }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Protected Notebook
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
            This notebook is password-protected. Please enter the password to access its contents.
          </Typography>

          <Fade in={true}>
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
                ),
                sx: {
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                  }
                }
              }}
              sx={{ mb: 3 }}
            />
          </Fade>

          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: 2,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                boxShadow: '0 6px 16px rgba(33, 150, 243, 0.3)'
              }
            }}
          >
            Unlock Notebook
          </Button>
        </Box>
      </Paper>
    </Dialog>
  );
};

export default PasswordPrompt;