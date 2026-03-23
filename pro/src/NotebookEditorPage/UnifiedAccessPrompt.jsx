import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
  alpha,
  Divider,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const UnifiedAccessPrompt = ({
  requiresPassword = false,
  requiresGuestName = false,
  notebookTitle = 'Untitled',
  creatorName = '',
  onSubmitPassword,
  onSubmitGuestName,
  loading = false,
  error = '',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [passwordError, setPasswordError] = useState(error);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    setPasswordError('');
    onSubmitPassword?.(password);
  };

  const handleGuestNameSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim() || guestName.trim().length < 2) {
      return;
    }
    onSubmitGuestName?.(guestName.trim());
  };

  // Step 1: Ask for guest name (if not authenticated)
  if (requiresGuestName) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.98),
          p: 3,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 420,
              width: '100%',
              borderRadius: 4,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Person sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Welcome!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your name to join <strong>{notebookTitle}</strong>
              </Typography>
              {creatorName && (
                <Typography variant="caption" color="text.secondary">
                  Created by {creatorName}
                </Typography>
              )}
            </Box>

            <form onSubmit={handleGuestNameSubmit}>
              <TextField
                fullWidth
                autoFocus
                label="Your Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your display name"
                error={!!error}
                helperText={error || 'This name will be visible to other collaborators'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !guestName.trim() || guestName.trim().length < 2}
                endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                {loading ? 'Joining...' : 'Join Notebook'}
              </Button>
            </form>

            <Divider sx={{ my: 3 }}>
              <Chip label="or" size="small" />
            </Divider>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Already have an account?{' '}
              <Typography
                component="a"
                href="/auth?mode=login"
                variant="body2"
                color="primary"
                sx={{ textDecoration: 'none', fontWeight: 600 }}
              >
                Sign in
              </Typography>
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // Step 2: Ask for password (if notebook is password-protected)
  if (requiresPassword) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.98),
          p: 3,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 420,
              width: '100%',
              borderRadius: 4,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Lock sx={{ fontSize: 32, color: 'warning.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Password Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{notebookTitle}</strong> is protected with a password
              </Typography>
            </Box>

            <form onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                autoFocus
                label="Enter Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !password.trim()}
                endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  },
                }}
              >
                {loading ? 'Verifying...' : 'Unlock Notebook'}
              </Button>
            </form>

            {error && error.includes('password') && (
              <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                The password you entered is incorrect. Please try again.
              </Typography>
            )}
          </Paper>
        </motion.div>
      </Box>
    );
  }

  return null;
};

export default UnifiedAccessPrompt;
