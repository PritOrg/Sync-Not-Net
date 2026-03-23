import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Divider,
  Chip,
  alpha,
  Stack,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Person,
  Lock,
  Google,
  GitHub,
  ArrowForward,
  Edit,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const ModernAuthPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') === 'register';
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Update URL when mode changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newParams = new URLSearchParams();
    if (isSignUp) newParams.set('mode', 'register');
    navigate(`?${newParams.toString()}`, { replace: true });
  }, [isSignUp]);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp > Date.now() / 1000) {
          navigate('/notebooks');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
  }, [navigate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!formData.name) {
        errors.name = 'Name is required';
      } else if (formData.name.length < 2) {
        errors.name = 'Name must be at least 2 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = isSignUp ? '/api/users/register' : '/api/users/login';
      const payload = isSignUp
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setSuccess(isSignUp ? 'Account created successfully!' : 'Login successful!');
        setTimeout(() => navigate('/notebooks'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left side - Branding */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
            }}
          >
            <Edit sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          
          <Typography variant="h3" fontWeight={700} gutterBottom>
            SyncNote
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, mb: 4 }}>
            Collaborate on notes & code in real-time
          </Typography>

          <Stack spacing={2} sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
            {[
              'Real-time collaboration',
              'Rich text & code editor',
              'Secure sharing with QR codes',
              'Version history & auto-save',
            ].map((feature, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckCircle sx={{ fontSize: 20, color: 'rgba(255,255,255,0.9)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Stack>
        </motion.div>
      </Box>

      {/* Right side - Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          bgcolor: alpha(theme.palette.background.default, 0.98),
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              SyncNote
            </Typography>
          </Box>

          <motion.div
            key={isSignUp ? 'signup' : 'login'}
            initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {isSignUp ? 'Create account' : 'Welcome back'}
              </Typography>
              <Typography color="text.secondary">
                {isSignUp
                  ? 'Start your journey with SyncNote'
                  : 'Sign in to continue to your notebooks'}
              </Typography>
            </Box>

            {/* Social login buttons */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHub />}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                GitHub
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Chip label="or continue with email" size="small" />
            </Divider>

            {/* Error/Success alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    {success}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 },
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 },
                  }}
                />

                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    error={!!validationErrors.confirmPassword}
                    helperText={validationErrors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 },
                    }}
                  />
                )}

                {!isSignUp && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={<Checkbox size="small" />}
                      label={<Typography variant="body2">Remember me</Typography>}
                    />
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Forgot password?
                    </Typography>
                  </Box>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4)',
                    },
                  }}
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </Stack>
            </form>

            {/* Toggle mode */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  fontWeight={600}
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setValidationErrors({});
                  }}
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </Typography>
              </Typography>
            </Box>

            {/* Back to home */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                component={Link}
                to="/"
                startIcon={<ArrowBack />}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Back to home
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernAuthPage;