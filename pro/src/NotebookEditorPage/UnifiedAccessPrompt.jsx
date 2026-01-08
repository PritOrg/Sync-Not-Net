import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Lock,
  Public,
  People,
  Password as PasswordIcon,
  ArrowForward,
  Close
} from '@mui/icons-material';
import AccessPrompt from './AccessPrompt';

const UnifiedAccessPrompt = ({
  open,
  onClose,
  onProceed,
  notebook = {},
  urlIdentifier,
  isAuthenticated = false,
  isCollaborator = false
}) => {
  const [state, setState] = useState({
    showPasswordPrompt: false,
    error: '',
    isLoading: false
  });

  const { showPasswordPrompt, error, isLoading } = state;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setState(prev => ({
        ...prev,
        showPasswordPrompt: false,
        error: ''
      }));
    }
  }, [open]);

  // Helper function to determine access type
  const getAccessType = () => {
    if (!notebook) return 'unknown';
    if (notebook.permissions === 'public') return 'public';
    if (notebook.permissions === 'private' && isCollaborator) return 'collaborator';
    if (notebook.requiresPassword) return 'password';
    if (notebook.permissions === 'private') return 'private';
    return 'unknown';
  };

  // Helper to get access description
  const getAccessDescription = () => {
    const accessType = getAccessType();
    switch (accessType) {
      case 'public':
        return "This is a public notebook that anyone can access.";
      case 'collaborator':
        return "You have collaborator access to this notebook.";
      case 'password':
        return "This notebook is protected by a password.";
      case 'private':
        return "This notebook is private and only accessible to invited collaborators.";
      default:
        return "Access type unknown.";
    }
  };

  // Handle access verification
  const handleAccess = async () => {
    const accessType = getAccessType();
    
    if (accessType === 'password') {
      setState(prev => ({ ...prev, showPasswordPrompt: true }));
      return;
    }

    if (accessType === 'public' || accessType === 'collaborator') {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: '' }));
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        onProceed();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error.message || 'Failed to access notebook',
          isLoading: false
        }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
      return;
    }

    if (!isAuthenticated) {
      setState(prev => ({ 
        ...prev, 
        error: 'Please sign in to access this notebook'
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      error: 'You do not have permission to access this notebook'
    }));
  };

  // If password prompt is showing, render the AccessPrompt in password step
  if (showPasswordPrompt) {
    return (
      <AccessPrompt
        open={open}
        onSuccess={onProceed}
        onClose={() => {
          setState(prev => ({ ...prev, showPasswordPrompt: false }));
          onClose();
        }}
        notebook={{ ...notebook, urlIdentifier }}
        isAuthenticated={isAuthenticated}
        isCollaborator={isCollaborator}
        initialStep="password"
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
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
          <Close />
        </IconButton>

        <Box sx={{ 
          pt: 4,
          px: 3,
          textAlign: 'center',
          background: 'linear-gradient(to right, #ffffff, #f8f9fa)'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {notebook.title || 'Untitled Notebook'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            by {notebook.creator?.name || 'Unknown'}
          </Typography>
        </Box>

        <DialogContent>
          <Box sx={{ my: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Access Error</AlertTitle>
                {error}
              </Alert>
            )}

            <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getAccessType() === 'public' && <Public color="primary" />}
                  {getAccessType() === 'private' && <Lock color="error" />}
                  {getAccessType() === 'password' && <PasswordIcon color="warning" />}
                  {getAccessType() === 'collaborator' && <People color="success" />}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Access Information
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {getAccessDescription()}
                </Typography>
                {!isAuthenticated && notebook.permissions !== 'public' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Sign in to get more access options
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body1" color="text.secondary" paragraph>
              By accessing this notebook, you agree to respect the creator's intellectual property and follow our community guidelines.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            color="inherit"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccess}
            variant="contained"
            disabled={isLoading || (getAccessType() === 'private' && !isCollaborator)}
            endIcon={isLoading ? <CircularProgress size={16} /> : <ArrowForward />}
          >
            {isLoading ? 'Accessing...' : 'Access Notebook'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UnifiedAccessPrompt;