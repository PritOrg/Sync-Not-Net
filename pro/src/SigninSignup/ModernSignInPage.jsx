import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Paper,
  Container,
  Snackbar,
  Divider,
  Chip
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Person, 
  Lock, 
  Google,
  GitHub,
  ArrowForward
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const ModernSignInPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL params to determine initial mode
  const [isSignUp, setIsSignUp] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') === 'register';
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (isSignUp && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (isSignUp && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    
    // Name validation for sign up
    if (isSignUp) {
      if (!formData.name) {
        errors.name = 'Name is required';
      } else if (formData.name.length < 2) {
        errors.name = 'Name must be at least 2 characters long';
      } else if (formData.name.length > 50) {
        errors.name = 'Name cannot be longer than 50 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
        errors.name = 'Name can only contain letters and spaces';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Update URL when mode changes
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp > currentTime) {
          // Token is valid, redirect to notebooks
          navigate('/notebooks');
          return;
        } else {
          // Token is expired, remove it
          localStorage.removeItem('token');
        }
      } catch (error) {
        // Invalid token format, remove it
        localStorage.removeItem('token');
      }
    }

    // Update URL params based on mode
    const params = new URLSearchParams();
    if (isSignUp) {
      params.set('mode', 'register');
    } else {
      params.set('mode', 'login');
    }
    navigate(`?${params.toString()}`, { replace: true });
  }, [isSignUp, navigate]);

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
    setError(''); // Clear error when user starts typing
    
    // Clear specific field validation error when user starts typing
    if (validationErrors[prop]) {
      setValidationErrors(prev => ({
        ...prev,
        [prop]: undefined
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the validation errors and try again',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isSignUp ? '/api/users/register' : '/api/users/login';
      const payload = isSignUp 
        ? { name: formData.name, email: formData.email, password: formData.password } 
        : { email: formData.email, password: formData.password };
      
      const response = await axios.post(`${API_BASE_URL + endpoint}`, payload);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setSnackbar({
          open: true,
          message: isSignUp ? 'Account created successfully!' : 'Welcome back!',
          severity: 'success'
        });
        
        // Navigate after a brief delay to show success message
        setTimeout(() => {
          navigate('/notebooks');
        }, 1500);
      }
    } catch (error) {
      console.error('Authentication error:', error);

      let message = 'An unexpected error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const serverData = error.response.data;
        const serverMessage = serverData?.message;

        // Handle validation errors from backend
        if (status === 400 && serverData?.details && Array.isArray(serverData.details)) {
          const backendValidationErrors = {};
          serverData.details.forEach(detail => {
            backendValidationErrors[detail.field] = detail.message;
          });
          setValidationErrors(backendValidationErrors);
          message = 'Please fix the errors below and try again';
        } else {
          switch (status) {
            case 400:
              message = serverMessage || 'Invalid input. Please check your information.';
              break;
            case 401:
              message = 'Invalid credentials. Please check your email and password.';
              break;
            case 404:
              if (!isSignUp) {
                setIsSignUp(true);
                setFormData(prev => ({ ...prev, password: '' }));
                message = 'Account not found. Please create an account.';
              } else {
                message = 'Service not found. Please try again later.';
              }
              break;
            case 409:
              message = 'An account with this email already exists. Please sign in instead.';
              if (isSignUp) {
                setIsSignUp(false);
                setFormData(prev => ({ ...prev, name: '', password: '' }));
              }
              break;
            case 422:
              message = serverMessage || 'Please check your input and try again.';
              break;
            case 429:
              message = 'Too many attempts. Please wait a moment before trying again.';
              break;
            case 500:
              message = 'Server error. Please try again later.';
              break;
            default:
              message = serverMessage || `Error ${status}: Please try again.`;
          }
        }
      } else if (error.request) {
        // Network error
        message = 'Network error. Please check your connection and try again.';
      }

      setError(message);
      setSnackbar({
        open: true,
        message: `${isSignUp ? 'Registration' : 'Sign in'} failed: ${message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setValidationErrors({});
    setFormData({ email: formData.email, password: '', name: '' });
  };

  const isFormValid = () => {
    if (isSignUp) {
      return formData.email && formData.password && formData.name && 
             formData.password.length >= 8 && 
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
             formData.name.length >= 2 &&
             /^[a-zA-Z\s]+$/.test(formData.name) &&
             /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password);
    }
    return formData.email && formData.password && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
        position: 'relative',
        py: 3
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.palette.primary.main} 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, ${theme.palette.secondary.main} 2px, transparent 2px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 30px 30px'
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Sync Note Net
                </Typography>
              </motion.div>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                  mb: 1
                }}
              >
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary
                }}
              >
                {isSignUp 
                  ? 'Join thousands of teams collaborating seamlessly' 
                  : 'Sign in to continue to your workspace'}
              </Typography>
            </Box>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <Box component="form" onSubmit={handleFormSubmit} sx={{ width: '100%' }}>
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TextField
                      label="Full Name"
                      value={formData.name}
                      onChange={handleChange('name')}
                      fullWidth
                      variant="outlined"
                      required
                      error={!!validationErrors.name}
                      helperText={validationErrors.name}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="primary" />
                            </InputAdornment>
                          )
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': {
                            borderColor: validationErrors.name ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: validationErrors.name ? 'error.main' : theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: validationErrors.name ? 'error.main' : theme.palette.primary.main,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: validationErrors.name ? 'error.main' : theme.palette.text.primary,
                        },
                        '& .MuiOutlinedInput-input': {
                          color: theme.palette.text.primary,
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <TextField
                label="Email Address"
                value={formData.email}
                onChange={handleChange('email')}
                fullWidth
                variant="outlined"
                required
                type="email"
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '& fieldset': {
                      borderColor: validationErrors.email ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: validationErrors.email ? 'error.main' : theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: validationErrors.email ? 'error.main' : theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: validationErrors.email ? 'error.main' : theme.palette.text.primary,
                  },
                  '& .MuiOutlinedInput-input': {
                    color: theme.palette.text.primary,
                  }
                }}
              />

              <TextField
                label="Password"
                value={formData.password}
                onChange={handleChange('password')}
                fullWidth
                variant="outlined"
                required
                type={showPassword ? 'text' : 'password'}
                error={!!validationErrors.password}
                helperText={validationErrors.password || (isSignUp ? 'Must be at least 8 characters with uppercase, lowercase, number, and special character' : '')}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '& fieldset': {
                      borderColor: validationErrors.password ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: validationErrors.password ? 'error.main' : theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: validationErrors.password ? 'error.main' : theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: validationErrors.password ? 'error.main' : theme.palette.text.primary,
                  },
                  '& .MuiOutlinedInput-input': {
                    color: theme.palette.text.primary,
                  }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!isFormValid() || loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  mb: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  }
                }}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </Box>

            {/* Social Login Options */}
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }}>
                <Chip label="or continue with" size="small" />
              </Divider>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <IconButton
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 1.5,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <Google />
                </IconButton>
                <IconButton
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 1.5,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <GitHub />
                </IconButton>
              </Box>
            </Box>

            {/* Toggle Form */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={toggleForm}
                sx={{
                  color: theme.palette.primary.main,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    background: 'transparent',
                    color: theme.palette.primary.dark
                  }
                }}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Create one"}
              </Button>
            </Box>
          </Paper>

          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 3, textAlign: 'center', display: 'block' }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </motion.div>
      </Container>

      {/* Snackbar for success messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModernSignInPage;
