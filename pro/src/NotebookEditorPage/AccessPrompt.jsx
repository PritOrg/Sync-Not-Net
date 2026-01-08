import React, { useState, useEffect, useCallback } from 'react';
import {
  withTimeout,
  withRetry,
  validateGuestName,
  validatePassword
} from '../utils/accessUtils';
import AccessErrorBoundary from './AccessErrorBoundary';
import {
  Button,
  Dialog,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import {
  Public,
  Lock,
  Password as PasswordIcon,
  People,
  ArrowForward,
  Close as CloseIcon,
  Key as KeyIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const AccessTypeBadge = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'public': return <Public />;
      case 'private': return <Lock />;
      case 'password': return <PasswordIcon />;
      case 'collaborator': return <People />;
      default: return <Lock />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'public': return 'Public Access';
      case 'private': return 'Private Access';
      case 'password': return 'Password Protected';
      case 'collaborator': return 'Collaborator Access';
      default: return 'Restricted Access';
    }
  };

  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      bgcolor: 'background.paper',
      p: 1,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      {getIcon()}
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {getLabel()}
      </Typography>
    </Box>
  );
};

const AccessPrompt = ({
  open,
  onClose,
  onSuccess,
  notebook,
  isAuthenticated,
  isCollaborator,
  initialStep = 'info'
}) => {
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('guestName') || '');
  const [step, setStep] = useState(initialStep); // info, guest, password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
      setStep('info');
    }
  }, [open]);

  const verifyAccess = async () => {
    // Validate inputs first
    if (step === 'guest') {
      const guestNameError = validateGuestName(guestName);
      if (guestNameError) {
        throw new Error(guestNameError);
      }
    } else if (step === 'password') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }
    }

    // If notebook is public or user is collaborator, no verification needed
    if (notebook.permissions === 'public' || isCollaborator) {
      return { hasAccess: true };
    }

    // For password protected notebooks
    if (notebook.requiresPassword) {
        console.log('Verifying password for notebook:', notebook.urlIdentifier);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebook.urlIdentifier}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    }

    // For guest access
    if (!isAuthenticated && guestName) {
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebook.urlIdentifier}/register-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('guestName', guestName);
      return data;
    }

    throw new Error('Unable to verify access');
  };

  const handleAccessVerification = useCallback(async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Wrap the verification with timeout and retry logic
      const result = await withTimeout(
        withRetry(verifyAccess)
      );
      onSuccess(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [notebook, password, guestName, isAuthenticated, isCollaborator, onSuccess, verifyAccess]);

  const renderAccessInfo = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        {notebook.title || 'Untitled Notebook'}
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        by {notebook.creator?.name || 'Unknown'}
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AccessTypeBadge type={
              notebook.permissions === 'public' ? 'public' :
              notebook.requiresPassword ? 'password' :
              isCollaborator ? 'collaborator' : 'private'
            } />

            <Typography variant="body1" color="text.secondary">
              {notebook.permissions === 'public' && 'This notebook is public and can be accessed by anyone.'}
              {notebook.requiresPassword && 'This notebook is password-protected. You need the correct password to access it.'}
              {isCollaborator && 'You are a collaborator of this notebook.'}
              {notebook.permissions === 'private' && !isCollaborator && 'This notebook is private and requires specific access permissions.'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isAuthenticated && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sign in to get additional access options.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Cancel
        </Button>
        
        {(notebook.permissions === 'public' || isCollaborator) ? (
          <Button
            variant="contained"
            onClick={handleAccessVerification}
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={16} /> : <ArrowForward />}
          >
            Access Notebook
          </Button>
        ) : notebook.requiresPassword ? (
          <Button
            variant="contained"
            onClick={() => setStep('password')}
            endIcon={<KeyIcon />}
          >
            Enter Password
          </Button>
        ) : !isAuthenticated ? (
          <Button
            variant="contained"
            onClick={() => setStep('guest')}
            endIcon={<People />}
          >
            Continue as Guest
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/auth?mode=login'}
          >
            Sign In to Access
          </Button>
        )}
      </Box>
    </Box>
  );

  const renderPasswordStep = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Enter Password
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This notebook is password protected. Please enter the password to access it.
      </Typography>

      <Box component="form" onSubmit={(e) => {
        e.preventDefault();
        handleAccessVerification();
      }}>
        <TextField
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          error={!!error}
          helperText={error}
          autoFocus
          sx={{ mb: 3 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setStep('info')} 
            color="inherit" 
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !password}
            endIcon={isLoading ? <CircularProgress size={16} /> : <ArrowForward />}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderGuestStep = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Enter Your Name
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Please enter your name to continue as a guest.
      </Typography>

      <Box component="form" onSubmit={(e) => {
        e.preventDefault();
        handleAccessVerification();
      }}>
        <TextField
          fullWidth
          label="Your Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          disabled={isLoading}
          error={!!error}
          helperText={error}
          autoFocus
          sx={{ mb: 3 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setStep('info')} 
            color="inherit" 
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !guestName}
            endIcon={isLoading ? <CircularProgress size={16} /> : <ArrowForward />}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <AccessErrorBoundary
      onReset={() => {
        setError('');
        setIsLoading(false);
      }}
    >
      <Dialog
        open={open}
        onClose={!isLoading ? onClose : undefined}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary'
            }}
            disabled={isLoading}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ p: 3 }}>
            {step === 'info' && renderAccessInfo()}
            {step === 'password' && renderPasswordStep()}
            {step === 'guest' && renderGuestStep()}
          </Box>
        </Box>
      </Dialog>
    </AccessErrorBoundary>
  );
};

export default AccessPrompt;