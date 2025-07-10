import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Fade
} from '@mui/material';
import { PersonAdd, Lock, Visibility, VisibilityOff, Close } from '@mui/icons-material';

const UnifiedAccessPrompt = ({
  open,
  onClose,
  onSubmit,
  notebookTitle,
  creatorName,
  requiresGuestName = false,
  requiresPassword = false,
  isLoading = false,
  error = null,
  initialStep = null,
}) => {
  const [guestName, setGuestName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(initialStep || (requiresGuestName ? 'guestName' : 'password'));
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  React.useEffect(() => {
    setStep(initialStep || (requiresGuestName ? 'guestName' : 'password'));
  }, [requiresGuestName, requiresPassword, initialStep]);

  const handleNext = (e) => {
    e && e.preventDefault();
    if (step === 'guestName') {
      const trimmedName = guestName.trim();
      if (!trimmedName) {
        setNameError('Please enter a name');
        return;
      }
      if (trimmedName.length < 1) {
        setNameError('Name must be at least 1 character');
        return;
      }
      if (trimmedName.length > 50) {
        setNameError('Name must be less than 50 characters');
        return;
      }
      setNameError('');
      if (requiresPassword) {
        setStep('password');
      } else {
        onSubmit({ guestName: trimmedName });
      }
    } else if (step === 'password') {
      if (!password.trim()) {
        setPasswordError('Please enter a password');
        return;
      }
      setPasswordError('');
      onSubmit({ guestName: guestName.trim(), password: password.trim() });
    }
  };

  const handleBack = () => {
    if (step === 'password' && requiresGuestName) {
      setStep('guestName');
      setPasswordError('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 1 } }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          {step === 'guestName' ? <PersonAdd color="primary" /> : <Lock color="primary" />}
          <Typography variant="h6" component="span">
            {step === 'guestName' ? 'Join Collaboration' : 'Protected Notebook'}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary" align="center">
            You're about to collaborate on
          </Typography>
          <Typography variant="h6" align="center" sx={{ mt: 1, mb: 1 }}>
            "{notebookTitle}"
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            by {creatorName}
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleNext}>
          <Fade in={true}>
            {step === 'guestName' ? (
              <TextField
                autoFocus
                label="Your name for collaboration"
                type="text"
                fullWidth
                variant="outlined"
                value={guestName}
                onChange={e => { setGuestName(e.target.value); if (nameError) setNameError(''); }}
                error={!!nameError}
                helperText={nameError || "This name will be visible to other collaborators"}
                disabled={isLoading}
                placeholder="Enter your name"
                sx={{ mb: 2 }}
              />
            ) : (
              <TextField
                autoFocus
                label="Enter Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                value={password}
                onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                error={!!passwordError}
                helperText={passwordError}
                disabled={isLoading}
                placeholder="Enter password"
                sx={{ mb: 2 }}
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
              />
            )}
          </Fade>
          <Typography variant="caption" color="text.secondary" display="block">
            • Your changes will be saved in real-time<br />
            • Other collaborators will see your edits live<br />
            • You can edit all content except notebook settings
          </Typography>
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 'password' && requiresGuestName && (
          <Button onClick={handleBack} disabled={isLoading} color="inherit">
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={isLoading || (step === 'guestName' ? !guestName.trim() : false)}
          startIcon={isLoading ? <CircularProgress size={16} /> : (step === 'guestName' ? <PersonAdd /> : <Lock />)}
        >
          {isLoading ? (step === 'guestName' ? 'Joining...' : 'Verifying...') : (step === 'guestName' ? (requiresPassword ? 'Continue' : 'Join & Collaborate') : 'Access Notebook')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnifiedAccessPrompt;
