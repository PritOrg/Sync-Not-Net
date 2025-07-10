import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Fade,
  Backdrop,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Book as BookIcon,
  Share as ShareIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fadeIn, slideIn, bounceIn, getAnimationStyles } from '../utils/animations';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function TabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && children}
    </Box>
  );
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState('');

  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [userStats, setUserStats] = useState({
    totalNotebooks: 0,
    sharedNotebooks: 0,
    publicNotebooks: 0,
    totalCollaborators: 0,
    memberSince: new Date()
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user || data);
        setFormData({
          name: data.user?.name || data.name || '',
          email: data.user?.email || data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        });
        setIsEditing(false);
        
        // Update local storage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          name: data.user.name,
          email: data.user.email
        }));
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.message || 'Failed to update profile',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Password changed successfully!',
          severity: 'success'
        });
        setShowPasswordDialog(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f6f8fa',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box>
            {/* Back Button */}
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/notebooks')}
                sx={{
                  color: '#6b7280',
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                  }
                }}
              >
                Back to Notebooks
              </Button>
            </Box>

            {/* Error Messages */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {/* Header Section */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                color: 'white',
                ...getAnimationStyles(fadeIn, 'normal', '0.6s'),
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        border: '4px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        bgcolor: 'white',
                        color: '#6366f1',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          bgcolor: '#f8fafc',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      size="small"
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {userData.name || 'User'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body1">
                      {userData.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2">
                      Member since {formatDate(userData.createdAt)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    sx={{
                      bgcolor: 'white',
                      color: '#6366f1',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#f8fafc',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Edit Profile
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { 
                  icon: BookIcon, 
                  label: 'Total Notebooks', 
                  value: userStats.totalNotebooks,
                  color: '#10b981',
                  bg: '#ecfdf5'
                },
                { 
                  icon: ShareIcon, 
                  label: 'Shared Notebooks', 
                  value: userStats.sharedNotebooks,
                  color: '#f59e0b',
                  bg: '#fffbeb'
                },
                { 
                  icon: PublicIcon, 
                  label: 'Public Notebooks', 
                  value: userStats.publicNotebooks,
                  color: '#8b5cf6',
                  bg: '#faf5ff'
                },
                { 
                  icon: GroupIcon, 
                  label: 'Collaborators', 
                  value: userStats.totalCollaborators,
                  color: '#06b6d4',
                  bg: '#f0fdfa'
                }
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 3,
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.3s ease-in-out',
                      ...getAnimationStyles(slideIn, 'normal', `${0.2 + index * 0.1}s`),
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.1)',
                        borderColor: stat.color,
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: stat.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <stat.icon sx={{ fontSize: 28, color: stat.color }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#1f2937' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.label}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Helpful Tips Section */}
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 3,
                border: '1px solid #e3f2fd',
                p: 3,
                mb: 4,
                bgcolor: '#f8faff',
                ...getAnimationStyles(slideIn, 'normal', '0.6s'),
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1565c0' }}>
                💡 Profile Tips & Features
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    🔒 Keep Your Account Secure
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your password regularly and use a strong, unique password for your account.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    📊 Track Your Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor your notebook creation and collaboration stats to see your productivity.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    👥 Collaboration Made Easy
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share notebooks with custom permissions - perfect for team projects and documentation.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    ⚡ Pro Tips
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use auto-save to never lose work • Try both Rich Text and Code modes • Set passwords for sensitive content
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Tabs Section */}
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                ...getAnimationStyles(fadeIn, 'normal', '0.8s'),
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: '#f8fafc',
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    minHeight: 60,
                    '&.Mui-selected': {
                      color: '#6366f1',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#6366f1',
                    height: 3,
                  }
                }}
              >
                <Tab 
                  icon={<PersonIcon />} 
                  label="Profile Information" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<LockIcon />} 
                  label="Security" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<AssessmentIcon />} 
                  label="Activity" 
                  iconPosition="start"
                />
              </Tabs>

              {/* Profile Information Tab */}
              <TabPanel value={activeTab} index={0}>
                <Box p={4}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#1f2937' }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={userData.role || 'User'}
                        disabled
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Member Since"
                        value={formatDate(userData.createdAt)}
                        disabled
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {isEditing && (
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                        sx={{
                          bgcolor: '#6366f1',
                          color: 'white',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: '#5855eb',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: userData.name || '',
                            email: userData.email || '',
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        sx={{
                          color: '#6b7280',
                          borderColor: '#d1d5db',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: '#f9fafb',
                            borderColor: '#9ca3af',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={activeTab} index={1}>
                <Box p={4}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#1f2937' }}>
                    Password & Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Keep your account secure by regularly updating your password.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setShowPasswordDialog(true)}
                    sx={{
                      color: '#6366f1',
                      borderColor: '#6366f1',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#f0f4ff',
                        borderColor: '#5855eb',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Change Password
                  </Button>
                </Box>
              </TabPanel>

              {/* Activity Tab */}
              <TabPanel value={activeTab} index={2}>
                <Box p={4}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#1f2937' }}>
                    Account Activity
                  </Typography>
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      color: 'text.secondary'
                    }}
                  >
                    <AssessmentIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1" fontWeight={500}>
                      Activity tracking coming soon
                    </Typography>
                    <Typography variant="body2">
                      We're working on showing your recent activity and usage statistics.
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
            </Paper>

            {/* Password Change Dialog */}
            <Dialog
              open={showPasswordDialog}
              onClose={() => setShowPasswordDialog(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  ...getAnimationStyles(bounceIn, 'normal', '0.3s'),
                }
              }}
            >
              <DialogTitle sx={{ 
                fontWeight: 'bold', 
                fontSize: '1.25rem',
                color: '#1f2937',
                pb: 1
              }}>
                Change Password
              </DialogTitle>
              <Divider />
              <DialogContent sx={{ pt: 3 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      }
                    }
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button 
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setFormData(prev => ({
                      ...prev,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    }));
                  }}
                  sx={{
                    color: '#6b7280',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  sx={{
                    bgcolor: '#6366f1',
                    color: 'white',
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#5855eb',
                    },
                    '&:disabled': {
                      bgcolor: '#d1d5db',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProfilePage;