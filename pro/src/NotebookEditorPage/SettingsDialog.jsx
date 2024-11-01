import React, { useState, useEffect } from 'react';
import { Dialog, TextField, Checkbox, Autocomplete, Button, Typography, Box, Select, MenuItem, Chip, Divider, DialogContent, DialogTitle } from '@mui/material';
import { Lock, Tag, User, Share2, Link, Save } from 'lucide-react';

const SettingsDialog = ({ open, onClose, notebookData, searchCollaborators, saveURL, onSave, urlIdentifier }) => {
  const [password, setPassword] = useState(notebookData.password || '');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(!!notebookData.password);
  const [collaborators, setCollaborators] = useState([]);
  const [tags, setTags] = useState(notebookData.tags || []);
  const [permissions, setPermissions] = useState(notebookData.permissions || 'everyone');
  const [customURL, setCustomURL] = useState(urlIdentifier || notebookData.urlIdentifier);
  const [inputValue, setInputValue] = useState('');
  const [collaboratorOptions, setCollaboratorOptions] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (notebookData.collaborators) {
      setCollaborators(notebookData.collaborators);
      setCollaboratorOptions(notebookData.collaborators); // Populate initial options
    }
    if (notebookData.tags) {
      setTags(notebookData.tags); // Ensure tags are set from notebookData
    }
  }, [notebookData]);

  const handleCollaboratorSearch = async (query) => {
    if (query.length > 2) {
      const results = await searchCollaborators(query);
      setCollaboratorOptions(results); // Merge with existing options
    }
  };

  const handleCollaboratorChange = (event, newValue) => {
    setCollaborators(newValue);
  };

  const handleSaveUrl = async () => {
    await saveURL(notebookData._id, customURL);
    onClose();
  }

  const handleSave = async () => {
    const settingsData = {
      collaborators,
      tags,
      permissions,
      urlIdentifier: customURL,
    };

    // Only add the password if it has changed
    if (isPasswordEnabled && password !== notebookData.password) {
      settingsData.password = password;
    }

    await onSave(settingsData);
    onClose();
  };
  const handleAddTag = (event) => {
    if (event.key === 'Enter' && tagInput.trim() !== '') {
      setTags((prevTags) => [...prevTags, tagInput.trim()]);
      setTagInput(''); // Clear input field after adding tag
    }
  };

  const handleDeleteTag = (tagToDelete) => () => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToDelete));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }
      }}
    >
      <DialogTitle sx={{
        textAlign: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        pb: 2,
        background: 'linear-gradient(to right, #f7f9fc, #edf1f7)'
      }}>
        <Typography variant="h5" fontWeight="600">Notebook Settings</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Security Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Security
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8f9fa',
              borderRadius: 1,
              p: 1
            }}>
              <Checkbox
                checked={isPasswordEnabled}
                onChange={() => setIsPasswordEnabled(prev => !prev)}
                sx={{ '&.Mui-checked': { color: '#2196f3' } }}
              />
              <Typography variant="body1">
                {notebookData.password ? 'Change Password' : 'Set Password'}
              </Typography>
              <Lock style={{ marginLeft: 8, color: '#2196f3' }} size={18} />
            </Box>

            {isPasswordEnabled && (
              <TextField
                label="Password"
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tags Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Tags
            </Typography>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 2,
              minHeight: 40,
              p: 1,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 1,
              background: '#fff'
            }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={handleDeleteTag(tag)}
                  sx={{
                    borderRadius: 1,
                    background: '#e3f2fd',
                    '&:hover': { background: '#bbdefb' }
                  }}
                />
              ))}
            </Box>
            <TextField
              label="Add tags"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={handleAddTag}
              fullWidth
              variant="outlined"
              placeholder="Press Enter to add"
              InputProps={{
                endAdornment: <Tag style={{ color: '#757575' }} size={18} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Permissions Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Access Control
            </Typography>
            <Select
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              fullWidth
              sx={{
                borderRadius: 1.5,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0,0,0,0.1)'
                }
              }}
            >
              <MenuItem value="everyone">Everyone</MenuItem>
              <MenuItem value="creator-only">Creator Only</MenuItem>
            </Select>
          </Box>

          {/* Collaborators Section */}
          <Autocomplete
            multiple
            options={collaboratorOptions}
            getOptionLabel={(option) => option.name || option.email || ''}
            value={collaborators}
            onChange={handleCollaboratorChange}
            inputValue={inputValue}
            onInputChange={(event, value) => {
              setInputValue(value);
              handleCollaboratorSearch(value);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Collaborators"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <User style={{ marginRight: 8, color: '#2196f3' }} size={18} />
                {option.name}
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  label={option.name}
                  sx={{
                    borderRadius: 1,
                    background: '#e3f2fd',
                    '&:hover': { background: '#bbdefb' }
                  }}
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option._id === value._id}
            sx={{ width: '100%', mb: 2 }}
          />

          {/* Custom URL Section */}
          <TextField
            label="Custom URL"
            value={customURL}
            onChange={e => setCustomURL(e.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              endAdornment: <Link style={{ color: '#757575' }} size={18} />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5
              }
            }}
          />

          {/* Action Buttons */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            mt: 3,
            pt: 2,
            borderTop: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Button
              variant="outlined"
              onClick={handleSaveUrl}
              startIcon={<Save size={18} />}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                flex: 1
              }}
            >
              Save URL
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<Save size={18} />}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                flex: 1,
                background: 'linear-gradient(45deg, #2196f3, #1976d2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2, #1565c0)'
                }
              }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;