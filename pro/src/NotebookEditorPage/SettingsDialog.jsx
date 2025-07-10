import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  TextField, 
  Button, 
  Typography, 
  Box,
  DialogContent, 
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Alert,
  Stack,
  Chip
} from '@mui/material';
import { 
  Close as CloseIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  People as PeopleIcon,
  Save as SaveIcon,
  Link as LinkIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const SettingsDialog = ({ open, onClose, notebookData, onSave, urlIdentifier, onOpenPasswordDialog, onOpenPermissionsDialog, onOpenCollaboratorsDialog, disabled }) => {
  const navigate = useNavigate();
  const [customUrl, setCustomUrl] = useState(urlIdentifier || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tags, setTags] = useState(notebookData.tags || []);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (open && notebookData) {
      setCustomUrl(urlIdentifier || '');
      setTags(notebookData.tags || []);
    }
  }, [open, notebookData, urlIdentifier]);

  const handleSave = async (specificSettings = {}, skipClose = false, settingsType = null) => {
    if (settingsType) {
      // If we're just opening a specialized settings dialog
      onSave({}, true, settingsType);
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // Handle URL update only through this main dialog
      const urlSettings = { urlIdentifier: customUrl };
      await onSave(urlSettings, skipClose);
      
      setSuccess('Custom URL updated successfully!');
      setTimeout(() => {
        if (!skipClose) {
          onClose();
        }
        setSuccess('');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUrlSave = async () => {
    try {
      await handleSave({ urlIdentifier: customUrl });
      navigate(`/notebook/${customUrl}`); // Navigate to the new URL
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePasswordSave = async (password) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      setSuccess('Password updated successfully!');
    } catch (error) {
      setError('Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionsSave = async (permissions) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/permissions`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions })
      });
      setSuccess('Permissions updated successfully!');
    } catch (error) {
      setError('Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleCollaboratorsSave = async (collaborators) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/collaborators`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ collaborators })
      });
      setSuccess('Collaborators updated successfully!');
    } catch (error) {
      setError('Failed to update collaborators.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagsSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/tags`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tags })
      });
      setSuccess('Tags updated successfully!');
    } catch (error) {
      setError('Failed to update tags.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            bgcolor: '#fefefe'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3, 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: '#4a5568' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748' }}>
              Notebook Settings
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#718096' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={4}>
            {/* Custom URL Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', opacity: disabled ? 0.5 : 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinkIcon sx={{ mr: 1, color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Custom URL
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="my-notebook-url"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: 2
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="body2" color="text.secondary">
                          /notebook/
                        </Typography>
                      </InputAdornment>
                    )
                  }}
                  disabled={disabled}
                />
                <Button 
                  onClick={handleUrlSave}
                  variant="contained"
                  size="medium"
                  disabled={saving || disabled}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#5a67d8' }
                  }}
                >
                  Update URL
                </Button>
                {disabled && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Only the notebook owner can change the custom URL.
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* Settings Cards */}
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, color: '#2d3748' }}>
              Settings Management
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {/* Password Settings Card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: '#f0fff4', 
                  borderRadius: 2, 
                  border: '1px solid #9ae6b4',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                    borderColor: '#68d391'
                  }
                }}
                onClick={() => !disabled && onOpenPasswordDialog && onOpenPasswordDialog()}
              >
                {disabled && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Only the notebook owner can change password protection.
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LockIcon sx={{ mr: 1, color: '#38a169' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Password Protection
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Add or remove password protection for your notebook.
                  {notebookData.password && " Currently password protected."}
                </Typography>
              </Paper>

              {/* Permissions Settings Card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: '#eff6ff', 
                  borderRadius: 2, 
                  border: '1px solid #bfdbfe',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                    borderColor: '#93c5fd'
                  }
                }}
                onClick={() => !disabled && onOpenPermissionsDialog && onOpenPermissionsDialog()}
              >
                {disabled && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Only the notebook owner can change privacy and access settings.
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PublicIcon sx={{ mr: 1, color: '#3b82f6' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Privacy & Access
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Control who can access and edit your notebook.
                  Currently: {notebookData.permissions === 'everyone' ? 'Public' : 
                             notebookData.permissions === 'collaborators' ? 'Collaborators Only' : 'Private'}
                </Typography>
              </Paper>

              {/* Collaborators Settings Card */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  bgcolor: '#fff5f5', 
                  borderRadius: 2, 
                  border: '1px solid #fed7d7',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                    borderColor: '#feb2b2'
                  }
                }}
                onClick={() => !disabled && onOpenCollaboratorsDialog && onOpenCollaboratorsDialog()}
              >
                {disabled && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Only the notebook owner can manage collaborators.
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ mr: 1, color: '#e53e3e' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    Collaborators
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Manage who can collaborate on this notebook.
                  {notebookData.collaborators?.length > 0 
                    ? ` Currently ${notebookData.collaborators.length} collaborator${notebookData.collaborators.length !== 1 ? 's' : ''}.` 
                    : ' No collaborators yet.'}
                </Typography>
              </Paper>
            </Box>

            {/* Tags Management Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', opacity: disabled ? 0.5 : 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Tags Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="contained"
                    size="small"
                    disabled={disabled}
                    sx={{ borderRadius: 2, bgcolor: '#667eea', '&:hover': { bgcolor: '#5a67d8' } }}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={disabled ? undefined : () => handleRemoveTag(tag)}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Box>
                <Button
                  onClick={handleTagsSave}
                  variant="contained"
                  size="medium"
                  disabled={saving || disabled}
                  sx={{ mt: 2, borderRadius: 2, textTransform: 'none', bgcolor: '#667eea', '&:hover': { bgcolor: '#5a67d8' } }}
                >
                  Save Tags
                </Button>
                {disabled && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Only the notebook owner can manage tags.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Stack>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f0f0f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                onClick={onClose}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#e2e8f0',
                  color: '#4a5568'
                }}
              >
                Close
              </Button>
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 2, 
                  color: 'text.disabled',
                  fontSize: '0.65rem',
                  cursor: 'default',
                  '&:hover': {
                    color: theme => theme.palette.primary.main
                  }
                }}
              >
                July 2025 Build
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsDialog;