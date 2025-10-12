import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  Paper,
  Fade,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import { Close, Lock, Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const EnhancedPasswordPrompt = ({ 
  open, 
  onSuccess,
  urlIdentifier,
  notebookTitle = 'Untitled Notebook',
  creatorName = 'Unknown',
  onClose,
  requiresPassword = false,
  requiresGuestName = false,
  isAuthenticated = false
}) => {
  // Debug props
  // Initialize password prompt with the provided props
  // Form state
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState(() => {
    // Try to load from localStorage on component mount
    const savedName = localStorage.getItem('guestName');
    return savedName || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [guestInfo, setGuestInfo] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step state: 'guestName' -> 'password' -> access
  const [step, setStep] = useState(requiresGuestName && !guestName ? 'guestName' : 'password');

  useEffect(() => {
    // Reset form when dialog opens or closes
    if (open) {
      console.log('%c Dialog opened, setting initial step based on requirements', 'background: #4caf50; color: white;', {
        requiresGuestName,
        requiresPassword
      });
      
      // Check if we already have a saved guest name
      const savedName = localStorage.getItem('guestName');
      
      // If guest name is required but we already have one saved, skip that step
      if (requiresGuestName && savedName) {
        setGuestName(savedName);
        setStep(requiresPassword ? 'password' : 'guestName'); // Still show guest name if no password needed
      } else {
        setStep(requiresGuestName ? 'guestName' : 'password');
      }
      
      setError('');
    } else {
      // Clear form on close except guest name
      setPassword('');
      setError('');
    }
  }, [open, requiresGuestName, requiresPassword]);
  
  // Additional effect to update UI when requirements change
  useEffect(() => {
    console.log('Requirements changed:', { requiresGuestName, requiresPassword });
    if (open) {
      setStep(requiresGuestName ? 'guestName' : 'password');
    }
  }, [requiresGuestName, requiresPassword, open]);

  const handleSubmit = async (e) => {
    e && e.preventDefault();

    // Guest name validation
    if (step === 'guestName') {
      if (!guestName.trim()) {
        setError('Please enter your name');
        return;
      }
      
      if (requiresPassword) {
        // Move to password step if password is also required
        setStep('password');
        setError('');
        return;
      }
      
      // Process guest-only access (no password)
      try {
        setIsLoading(true);
        // Register guest-only access
        
        // Register guest
        const trimmedGuestName = guestName.trim();
        const response = await fetch(`${API_BASE_URL}/api/notebooks/${urlIdentifier}/register-guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestName: trimmedGuestName })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error registering as guest. Please try again.');
        }
        
        const data = await response.json();
        console.log('Guest registration successful:', data);
        
        if (data.guestUser) {
          console.log('%c Saving guest user info to localStorage:', 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px', data.guestUser);
          localStorage.setItem('guestInfo', JSON.stringify(data.guestUser));
          // Also store in the component state to pass to parent
          setGuestInfo(data.guestUser);
        } else {
          // If there's no guestUser in response, create one from input
          const guestData = { name: guestName.trim(), id: Date.now().toString() };
          console.log('Created fallback guest data:', guestData);
          localStorage.setItem('guestInfo', JSON.stringify(guestData));
          // Also store in local state
          setGuestInfo(guestData);
        }
        
        setIsLoading(false);
        // Save guest name to localStorage for future use
        localStorage.setItem('guestName', guestName.trim());
        
        // Use the proper guest data from either response or locally created
        onSuccess(data, guestInfo || { guestName: guestName.trim() });
        return;
      } catch (error) {
        console.error('Error registering guest:', error);
        setIsLoading(false);
        setError(error.message || 'Error registering as guest. Please try again.');
        return;
      }
    }

    // Password validation
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    // Password verification
    setIsLoading(true);
    setError('');

    try {
      console.log(`Verifying password for notebook: ${urlIdentifier}`);
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prepare the request body
      const body = { password };
      
      // Add guest information if needed
      if (!isAuthenticated && guestName) {
        // Try to get guestId from local guestInfo if available
        let guestId;
        try {
          const guestInfo = JSON.parse(localStorage.getItem('guestInfo'));
          if (guestInfo && guestInfo.id) guestId = guestInfo.id;
        } catch (err) {
          console.error('Error parsing guestInfo:', err);
        }
        
        if (guestId) body.guestId = guestId;
        body.guestName = guestName.trim();
      }

      if (!urlIdentifier) {
        console.error('Missing urlIdentifier for password verification');
        throw new Error('Cannot verify password: Missing notebook identifier');
      }
      
      // Verify password for the specified notebook identifier
      
      // Send password verification request to API
      
      // Make the API request
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${urlIdentifier}/verify-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      // Process the response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Password verification failed:', errorData);
        throw new Error(errorData.message || 'Incorrect password. Please try again.');
      }

      // Password verified successfully
      const data = await response.json();
      console.log('Verification response data:', data);
      
      // Handle guest user info if applicable
      if (!isAuthenticated && guestName && data.guestUser) {
        console.log('Setting guest user info:', data.guestUser);
        localStorage.setItem('guestInfo', JSON.stringify(data.guestUser));
        // Save guest name for future use
        localStorage.setItem('guestName', guestName.trim());
        setGuestInfo(data.guestUser);
      }
      
      // Success callback
      onSuccess(data, guestName ? { guestName: guestName.trim() } : undefined);
      
      // Reset form
      setPassword('');
      setGuestName('');
      setError('');
    } catch (error) {
      console.error('Password verification error:', error);
      setError(error.message || 'Error verifying password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'password' && requiresGuestName) {
      setStep('guestName');
      setError('');
    }
  };

  // Always render the Dialog but control its visibility with the open prop
  // Dialog visibility is controlled by the open prop
  
  return (
    <Dialog 
      open={open}
      onClose={!isLoading ? onClose : undefined}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxWidth: '400px',
          width: '100%',
          margin: 2,
          overflow: 'hidden' // For the LinearProgress
        }
      }}
    >
      {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      
      <Paper elevation={0}>
        <Box sx={{ 
          position: 'relative', 
          padding: 4,
          background: 'linear-gradient(145deg, #ffffff, #f5f7fa)'
        }}>
          {!isLoading && (
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
          )}

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
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ lineHeight: 1.6 }}
            >
              {step === 'guestName' 
                ? 'Please enter your name to collaborate on this notebook.'
                : 'This notebook is password-protected. Please enter the password to access its contents.'
              }
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mt: 1.5, 
                fontWeight: 500,
                color: 'primary.main'
              }}
            >
              "{notebookTitle}"
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              by {creatorName}
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Fade in={true}>
              <Box>
                {step === 'guestName' ? (
                  <>
                    <TextField
                      label="Your Name"
                      type="text"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        if (error) setError('');
                      }}
                      error={Boolean(error)}
                      helperText={error || "This name will be visible to other collaborators"}
                      fullWidth
                      variant="outlined"
                      autoFocus
                      disabled={isLoading}
                      placeholder="Enter your name"
                      sx={{ 
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(255,255,255,0.8)',
                        }
                      }}
                    />
                    {localStorage.getItem('guestName') && guestName !== localStorage.getItem('guestName') && (
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => setGuestName(localStorage.getItem('guestName'))}
                        sx={{ mb: 2 }}
                      >
                        Use saved name: {localStorage.getItem('guestName')}
                      </Button>
                    )}
                  </>
                ) : (
                  <TextField
                    label="Enter Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    error={Boolean(error)}
                    helperText={error}
                    fullWidth
                    variant="outlined"
                    autoFocus
                    disabled={isLoading}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          disabled={isLoading}
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                      }
                    }}
                  />
                )}
              </Box>
            </Fade>

            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: step === 'password' && requiresGuestName ? 'row' : 'column' 
            }}>
              {step === 'password' && requiresGuestName && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outlined"
                  disabled={isLoading}
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
                type="submit"
                variant="contained"
                disabled={isLoading || (step === 'guestName' ? !guestName.trim() : !password.trim())}
                startIcon={isLoading && <CircularProgress size={16} color="inherit" />}
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
                {isLoading 
                  ? (step === 'guestName' ? 'Joining...' : 'Verifying...') 
                  : (step === 'guestName' 
                      ? (requiresPassword ? 'Continue' : 'Join Collaboration') 
                      : 'Access Notebook'
                    )
                }
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
    </Dialog>
  );
};

export default EnhancedPasswordPrompt;