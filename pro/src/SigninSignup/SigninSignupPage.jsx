import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  Fade,
  Zoom,
  useMediaQuery
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Person, 
  Lock, 
  Google, 
  GitHub, 
  Apple, 
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Custom motion components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const SignInSignUpPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
    setError(''); // Clear error when user starts typing
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isSignUp ? '/api/users/register' : '/api/users/login';
      const payload = isSignUp 
        ? { name: formData.name, email: formData.email, password: formData.password } 
        : { email: formData.email, password: formData.password };
      
      // Simulating network delay for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.post(`${API_BASE_URL + endpoint}`, payload);
      
      if (response.data.token) {
        setSuccessMessage(isSignUp ? 'Account created successfully!' : 'Login successful!');
        setTimeout(() => {
          localStorage.setItem('token', response.data.token);
          navigate('/notebooks');
        }, 1000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred';
      if (!isSignUp && error.response?.status === 404) {
        setIsSignUp(true);
        setFormData(prev => ({ ...prev, password: '' }));
        setError('Account not found. Please register.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
    setFormData({ email: formData.email, password: '', name: '' });
  };

  const isFormValid = () => {
    if (isSignUp) {
      return formData.email && formData.password && formData.name && formData.password.length >= 6;
    }
    return formData.email && formData.password;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background with gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          opacity: 0.05,
          zIndex: -1,
        }}
      />
      
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${theme.palette.primary.main.substring(1)}' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          zIndex: -1,
        }}
      />

      {/* Left side content - Hidden on mobile */}
      {!isMobile && (
        <MotionBox
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: theme.palette.primary.main,
            padding: '40px',
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            fontWeight="800"
            sx={{ 
              mb: 4,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Sync Note Net
          </Typography>
          
          <Box 
            component="img" 
            src="https://img.freepik.com/free-vector/partners-holding-big-jigsaw-puzzle-pieces_74855-5278.jpg?t=st=1740656883~exp=1740660483~hmac=101cb63b28f3b63d2fc4e071300a9fd716e0a154cc58ac3572225c7f3dc18ba1&w=1800"
            alt="Collaboration illustration"
            sx={{ 
              width: '70%', 
              maxWidth: '500px',
              borderRadius: '16px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
              mb: 6
            }}
          />
          
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            {isSignUp ? 'Join thousands of teams' : 'Welcome back'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: '400px' }}>
            {isSignUp 
              ? 'Create, collaborate, and share notes in real-time with your team members.' 
              : 'Continue your journey with collaborative note-taking and seamless team workflows.'}
          </Typography>
        </MotionBox>
      )}

      {/* Form Section */}
      <Box
        sx={{
          flex: { xs: '1', md: '0 0 500px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: { xs: '20px', md: '40px' },
        }}
      >
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: '450px',
            padding: { xs: '30px', sm: '40px' },
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Zoom in={true} timeout={500}>
            <Typography 
              variant="h4" 
              component="h2"
              sx={{ 
                marginBottom: '24px', 
                fontWeight: 700,
                textAlign: 'center',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Typography>
          </Zoom>

          {isMobile && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 3, textAlign: 'center' }}
            >
              {isSignUp 
                ? 'Join thousands of teams collaborating in real-time' 
                : 'Sign in to continue your collaborative journey'}
            </Typography>
          )}

          {error && (
            <Fade in={!!error}>
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: '8px' }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {successMessage && (
            <Fade in={!!successMessage}>
              <Alert 
                severity="success" 
                sx={{ mb: 3, borderRadius: '8px' }}
              >
                {successMessage}
              </Alert>
            </Fade>
          )}

          <form onSubmit={handleFormSubmit}>
            {isSignUp && (
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                fullWidth
                variant="outlined"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />
            )}

            <TextField
              label="Email Address"
              value={formData.email}
              onChange={handleChange('email')}
              fullWidth
              variant="outlined"
              required
              type="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
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
              InputProps={{
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
                      size="large"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText={isSignUp ? "Password must be at least 6 characters" : ""}
              sx={{ 
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            />

            {!isSignUp && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button 
                  variant="text" 
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    color: theme.palette.primary.main
                  }}
                >
                  Forgot password?
                </Button>
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={loading || !isFormValid()}
              sx={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
                },
                '&.Mui-disabled': {
                  background: theme.palette.action.disabledBackground,
                }
              }}
              endIcon={!loading && <ArrowForward />}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <Box sx={{ position: 'relative', my: 4 }}>
            <Divider sx={{ my: 2 }} />
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                bgcolor: 'background.paper', 
                px: 2,
                color: 'text.secondary'
              }}
            >
              or continue with
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 2,
              mb: 4 
            }}
          >
            <IconButton 
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: '12px',
                p: 1.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white'
                }
              }}
            >
              <Google />
            </IconButton>
            <IconButton 
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: '12px',
                p: 1.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'black',
                  color: 'white'
                }
              }}
            >
              <GitHub />
            </IconButton>
            <IconButton 
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: '12px',
                p: 1.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'black',
                  color: 'white'
                }
              }}
            >
              <Apple />
            </IconButton>
          </Box>

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
        </MotionPaper>

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mt: 3, textAlign: 'center' }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Box>
    </Box>
  );
};

export default SignInSignUpPage;