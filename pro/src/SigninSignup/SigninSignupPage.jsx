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
  Paper
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Person, Lock } from '@mui/icons-material';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const SignInSignUpPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.BACKEND_URL;

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      const response = await axios.post(`${API_BASE_URL + endpoint}`, payload);
      console.log(response);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/notebooks');
      }
    } catch (error) {
      const message = error.response?.message || 'An error occurred';
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
    setFormData({ email: formData.email, password: '', name: '' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: { xs: '90%', sm: '400px' },
          padding: '40px',
          borderRadius: '20px',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            marginBottom: '30px', 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: '8px' }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleFormSubmit}>
          {isSignUp && (
            <TextField
              label="Name"
              value={formData.name}
              onChange={handleChange('name')}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            margin="normal"
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
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            value={formData.password}
            onChange={handleChange('password')}
            fullWidth
            margin="normal"
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
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading}
            sx={{
              marginTop: '24px',
              padding: '12px',
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '1.1rem',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </Button>
        </form>

        <Button
          onClick={toggleForm}
          sx={{
            marginTop: '20px',
            color: theme.palette.primary.main,
            textTransform: 'none',
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
      </Paper>
    </Box>
  );
};

export default SignInSignUpPage;