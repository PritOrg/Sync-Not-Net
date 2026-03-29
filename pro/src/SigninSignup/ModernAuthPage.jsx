import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Person,
  Lock,
  ArrowForward,
  Edit,
  ArrowBack,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import api from '../utils/apiRoutes';
import apiErrorHandler from '../utils/errorHandler';

const passwordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
};

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

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
  const [touched, setTouched] = useState({});

  const strength = passwordStrength(formData.password);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newParams = new URLSearchParams();
    if (isSignUp) newParams.set('mode', 'register');
    navigate(`?${newParams.toString()}`, { replace: true });
  }, [isSignUp]);

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

  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'name':
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  }, [formData.password]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setValidationErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setValidationErrors((prev) => ({ ...prev, [field]: error }));
    }
    if (field === 'password' && touched.confirmPassword) {
      const confirmError = formData.confirmPassword && value !== formData.confirmPassword
        ? 'Passwords do not match' : '';
      setValidationErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const errors = {};
    const fieldsToValidate = isSignUp
      ? ['name', 'email', 'password', 'confirmPassword']
      : ['email', 'password'];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) errors[field] = err;
    });

    setTouched(Object.fromEntries(fieldsToValidate.map((f) => [f, true])));
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const payload = isSignUp
        ? { name: formData.name.trim(), email: formData.email.trim().toLowerCase(), password: formData.password }
        : { email: formData.email.trim().toLowerCase(), password: formData.password };

      const url = isSignUp ? api.register() : api.login();
      const response = await axios.post(url, payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setSuccess(isSignUp ? 'Account created! Redirecting...' : 'Welcome back! Redirecting...');
        setTimeout(() => navigate('/notebooks'), 800);
      }
    } catch (err) {
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    if (!isSignUp || !formData.password) return null;
    return (
      <Box sx={{ mt: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={(strength / 5) * 100}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: alpha(strengthColors[strength - 1] || '#e5e7eb', 0.2),
            '& .MuiLinearProgress-bar': {
              bgcolor: strengthColors[strength - 1] || '#e5e7eb',
              borderRadius: 2,
            },
          }}
        />
        <Typography variant="caption" sx={{ color: strengthColors[strength - 1] || 'text.secondary', mt: 0.25, display: 'block' }}>
          {strengthLabels[strength - 1] || 'Too short'}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
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
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4 }}>
            <Edit sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>SyncNote</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, mb: 4 }}>Collaborate on notes & code in real-time</Typography>
          <Stack spacing={2} sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
            {['Real-time collaboration', 'Rich text & code editor', 'Secure sharing with QR codes', 'Version history & auto-save'].map((feature, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckCircle sx={{ fontSize: 20, color: 'rgba(255,255,255,0.9)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>{feature}</Typography>
              </Box>
            ))}
          </Stack>
        </motion.div>
      </Box>

      {/* Right side - Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: alpha(theme.palette.background.default, 0.98) }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>SyncNote</Typography>
          </Box>

          <motion.div key={isSignUp ? 'signup' : 'login'} initial={{ opacity: 0, x: isSignUp ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isSignUp ? -20 : 20 }} transition={{ duration: 0.3 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>{isSignUp ? 'Create account' : 'Welcome back'}</Typography>
              <Typography color="text.secondary">{isSignUp ? 'Start your journey with SyncNote' : 'Sign in to continue to your notebooks'}</Typography>
            </Box>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    onBlur={() => handleBlur('name')}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    autoComplete="name"
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment>),
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
                  onBlur={() => handleBlur('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><Email sx={{ color: 'text.secondary' }} /></InputAdornment>),
                    sx: { borderRadius: 2 },
                  }}
                />

                <Box>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    onBlur={() => handleBlur('password')}
                    error={!!validationErrors.password}
                    helperText={!validationErrors.password && isSignUp ? 'Minimum 6 characters' : validationErrors.password}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><Lock sx={{ color: 'text.secondary' }} /></InputAdornment>),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" tabIndex={-1}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 },
                    }}
                  />
                  {renderPasswordStrength()}
                </Box>

                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                    error={!!validationErrors.confirmPassword}
                    helperText={validationErrors.confirmPassword}
                    autoComplete="new-password"
                    InputProps={{
                      startAdornment: (<InputAdornment position="start"><Lock sx={{ color: 'text.secondary' }} /></InputAdornment>),
                      sx: { borderRadius: 2 },
                    }}
                  />
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
                    '&:disabled': { background: '#d1d5db', boxShadow: 'none' },
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
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setValidationErrors({}); setTouched({}); }}
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </Typography>
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button component={Link} to="/" startIcon={<ArrowBack />} sx={{ textTransform: 'none', color: 'text.secondary' }}>
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
