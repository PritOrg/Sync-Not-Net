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
  Badge,
  Chip,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Camera,
  Edit2,
  Key,
  Mail,
  Shield,
  Clock,
  BookOpen,
  Activity,
  Save,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'editor',
    profilePicture: null,
    createdAt: new Date('2024-01-01'),
    stats: {
      totalNotebooks: 15,
      sharedNotebooks: 5,
      totalCollaborators: 8,
      lastActive: new Date()
    }
  });

  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      try {
        // Implement image upload logic here
        // const response = await uploadProfilePicture(file);
        // setUserData(prev => ({ ...prev, profilePicture: response.url }));
        setSuccess('Profile picture updated successfully');
      } catch (err) {
        setError('Failed to upload profile picture');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Implement profile update logic here
      // await updateProfile(formData);
      setUserData(prev => ({
        ...prev,
        name: formData.name,
        email: formData.email
      }));
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Implement password change logic here
      // await changePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Password changed successfully');
      setShowPasswordDialog(false);
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 2,
            background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    component="label"
                    sx={{
                      bgcolor: 'white',
                      '&:hover': { bgcolor: alpha('#fff', 0.9) }
                    }}
                  >
                    <Camera size={16} />
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </IconButton>
                }
              >
                <Avatar
                  src={userData.profilePicture}
                  sx={{ width: 120, height: 120, border: '4px solid white' }}
                >
                  {userData.name[0]}
                </Avatar>
              </Badge>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {userData.name}
              </Typography>
              <Typography variant="subtitle1">
                <Mail size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                {userData.email}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={<Shield size={16} />}
                  label={userData.role.toUpperCase()}
                  sx={{ 
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Box>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Edit2 />}
                onClick={() => setIsEditing(true)}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha('#fff', 0.9) }
                }}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            { icon: BookOpen, label: 'Total Notebooks', value: userData.stats.totalNotebooks },
            { icon: Activity, label: 'Shared Notebooks', value: userData.stats.sharedNotebooks },
            { icon: Shield, label: 'Collaborators', value: userData.stats.totalCollaborators },
            { icon: Clock, label: 'Member Since', value: new Date(userData.createdAt).toLocaleDateString() }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2,
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <stat.icon size={24} color={theme.palette.primary.main} />
                <Typography variant="h5" fontWeight="bold" sx={{ my: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Tabs Section */}
        <Paper elevation={0} sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Profile Information" />
            <Tab label="Security" />
            <Tab label="Activity" />
          </Tabs>

          {/* Profile Information Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<X />}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Password & Security
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Key />}
                onClick={() => setShowPasswordDialog(true)}
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </Box>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {/* Add activity timeline here */}
            </Box>
          </TabPanel>
        </Paper>

        {/* Password Change Dialog */}
        <Dialog
          open={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handlePasswordChange}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Messages */}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess('')}
            sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 2000 }}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError('')}
            sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 2000 }}
          >
            {error}
          </Alert>
        )}
      </motion.div>
    </Container>
  );
};

export default ProfilePage;