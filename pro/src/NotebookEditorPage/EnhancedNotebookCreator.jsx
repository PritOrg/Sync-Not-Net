import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Fade,
  Slide
} from '@mui/material';
import {
  Add,
  Close,
  Save,
  Visibility,
  VisibilityOff,
  People,
  Lock,
  Public,
  Settings,
  Code,
  Article,
  Palette,
  AutoMode,
  Preview,
  RestartAlt,
  SmartToy,
  CloudUpload,
  Download,
  Share,
  Bookmark,
  Schedule
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const EnhancedNotebookCreator = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    permissions: 'everyone',
    collaborators: [],
    password: '',
    tags: [],
    editorMode: 'quill',
    autoSave: true,
    description: '',
    category: 'general',
    language: 'markdown',
    template: 'blank'
  });

  // UI state
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});

  const steps = [
    { title: 'Basic Info', icon: <Article /> },
    { title: 'Content & Editor', icon: <Code /> },
    { title: 'Collaboration', icon: <People /> },
    { title: 'Advanced Settings', icon: <Settings /> }
  ];

  const templates = [
    { id: 'blank', name: 'Blank Document', content: '', description: 'Start with a clean slate' },
    { id: 'meeting', name: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n## Action Items\n- [ ] \n\n## Next Steps\n', description: 'Template for meeting documentation' },
    { id: 'project', name: 'Project Plan', content: '# Project Plan\n\n## Overview\n\n## Objectives\n\n## Timeline\n\n## Resources\n\n## Milestones\n\n## Risks\n', description: 'Structure for project planning' },
    { id: 'research', name: 'Research Notes', content: '# Research Topic\n\n## Abstract\n\n## Sources\n\n## Key Findings\n\n## Analysis\n\n## Conclusions\n\n## References\n', description: 'Template for research documentation' },
    { id: 'code', name: 'Code Documentation', content: '# Code Documentation\n\n## Overview\n\n```javascript\n// Your code here\n```\n\n## API Reference\n\n## Examples\n\n## Testing\n', description: 'Template for code documentation' }
  ];

  const categories = [
    'general', 'project', 'meeting', 'research', 'documentation', 
    'tutorial', 'personal', 'work', 'study', 'creative'
  ];

  const languages = [
    'markdown', 'javascript', 'python', 'html', 'css', 'json', 
    'yaml', 'xml', 'sql', 'bash', 'plaintext'
  ];

  useEffect(() => {
    // Fetch available users for collaboration
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      content: template.content,
      title: prev.title || template.name
    }));
  };

  const addCollaborator = () => {
    if (collaboratorInput.trim()) {
      const user = users.find(u => u.email === collaboratorInput || u.name === collaboratorInput);
      if (user && !formData.collaborators.find(c => c._id === user._id)) {
        setFormData(prev => ({
          ...prev,
          collaborators: [...prev.collaborators, user]
        }));
      }
      setCollaboratorInput('');
    }
  };

  const removeCollaborator = (collaboratorId) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c._id !== collaboratorId)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};

    switch (stepIndex) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        break;
      case 1:
        if (!formData.content.trim()) newErrors.content = 'Content cannot be empty';
        break;
      case 2:
        if (formData.permissions === 'password' && !formData.password) {
          newErrors.password = 'Password is required for password-protected notebooks';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        collaborators: formData.collaborators.map(c => c._id)
      };

      const response = await axios.post(`${API_BASE_URL}/api/notebooks`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({
        open: true,
        message: 'Notebook created successfully!',
        severity: 'success'
      });

      // Navigate to the new notebook
      setTimeout(() => {
        navigate(`/Notebook/${response.data.notebook.urlIdentifier}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating notebook:', error);
      
      let message = 'Failed to create notebook';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      setSnackbar({
        open: true,
        message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notebook Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    label="Category"
                    sx={{ borderRadius: 2 }}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={formData.template}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      handleInputChange('template', e.target.value);
                      if (template) handleTemplateSelect(template);
                    }}
                    label="Template"
                    sx={{ borderRadius: 2 }}
                  >
                    {templates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        <Box>
                          <Typography variant="body2">{template.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={2}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Editor Mode</InputLabel>
                  <Select
                    value={formData.editorMode}
                    onChange={(e) => handleInputChange('editorMode', e.target.value)}
                    label="Editor Mode"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="quill">Rich Text Editor</MenuItem>
                    <MenuItem value="monaco">Code Editor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    label="Language"
                    sx={{ borderRadius: 2 }}
                  >
                    {languages.map(lang => (
                      <MenuItem key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Initial Content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  error={!!errors.content}
                  helperText={errors.content || 'You can edit this content later in the full editor'}
                  multiline
                  rows={8}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoSave}
                      onChange={(e) => handleInputChange('autoSave', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enable Auto-save"
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Access Permissions</InputLabel>
                  <Select
                    value={formData.permissions}
                    onChange={(e) => handleInputChange('permissions', e.target.value)}
                    label="Access Permissions"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="everyone">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Public />
                        <Box>
                          <Typography>Public</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Anyone can view this notebook
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                    <MenuItem value="collaborators">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People />
                        <Box>
                          <Typography>Collaborators Only</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Only you and collaborators can access
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                    <MenuItem value="password">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lock />
                        <Box>
                          <Typography>Password Protected</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requires password to access
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.permissions === 'password' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Collaborators
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Autocomplete
                    fullWidth
                    options={users}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={null}
                    onChange={(e, value) => {
                      if (value && !formData.collaborators.find(c => c._id === value._id)) {
                        setFormData(prev => ({
                          ...prev,
                          collaborators: [...prev.collaborators, value]
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search users"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    )}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.collaborators.map((collaborator) => (
                    <Chip
                      key={collaborator._id}
                      label={`${collaborator.name} (${collaborator.email})`}
                      onDelete={() => removeCollaborator(collaborator._id)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={addTag}
                    sx={{ borderRadius: 2, minWidth: 'auto' }}
                  >
                    <Add />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Title:</Typography>
                        <Typography variant="body1">{formData.title || 'Untitled'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Category:</Typography>
                        <Typography variant="body1">
                          {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Editor:</Typography>
                        <Typography variant="body1">
                          {formData.editorMode === 'quill' ? 'Rich Text Editor' : 'Code Editor'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Access:</Typography>
                        <Typography variant="body1">
                          {formData.permissions === 'everyone' ? 'Public' : 
                           formData.permissions === 'collaborators' ? 'Collaborators Only' : 
                           'Password Protected'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Collaborators:</Typography>
                        <Typography variant="body1">{formData.collaborators.length}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Tags:</Typography>
                        <Typography variant="body1">{formData.tags.length}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.background.paper})`,
      py: 4
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 800,
            mx: 'auto',
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Header */}
          <Box sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            p: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Create New Notebook
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {steps[step].title}
            </Typography>
            
            {/* Progress */}
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(step + 1) / steps.length * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                    borderRadius: 3,
                  }
                }}
              />
            </Box>
          </Box>

          {/* Step Navigation */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {steps.map((stepInfo, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: index <= step ? 1 : 0.5,
                    cursor: index < step ? 'pointer' : 'default'
                  }}
                  onClick={() => index < step && setStep(index)}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: index <= step ? theme.palette.primary.main : theme.palette.grey[300],
                      color: index <= step ? 'white' : theme.palette.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}
                  >
                    {stepInfo.icon}
                  </Box>
                  <Typography variant="caption" textAlign="center">
                    {stepInfo.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3, minHeight: 400 }}>
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </Box>

          {/* Navigation */}
          <Box sx={{
            p: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={step === 0}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {step < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ borderRadius: 2 }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? null : <Save />}
                  sx={{ borderRadius: 2 }}
                >
                  {loading ? 'Creating...' : 'Create Notebook'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography>Creating your notebook...</Typography>
          </Paper>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedNotebookCreator;
