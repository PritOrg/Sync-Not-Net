import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { AutoFixHigh as PersonalizeIcon, Link as LinkIcon } from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import apiErrorHandler from '../utils/errorHandler';

const URL_PATTERN = /^[a-zA-Z0-9-_]+$/;

const NotebookUrlSettingsDialog = ({
  open,
  onClose,
  notebookId,
  currentUrlIdentifier = '',
  onUpdated,
  isOwner = false,
}) => {
  const [urlIdentifier, setUrlIdentifier] = useState(currentUrlIdentifier);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUrlIdentifier(currentUrlIdentifier || '');
    setError('');
  }, [currentUrlIdentifier, open]);

  const shareUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    const finalIdentifier = (urlIdentifier || currentUrlIdentifier || '').trim();
    return `${baseUrl}/Notebook/${finalIdentifier}`;
  }, [urlIdentifier, currentUrlIdentifier]);

  const validate = () => {
    const candidate = (urlIdentifier || '').trim();

    if (!candidate) {
      return 'URL identifier is required';
    }

    if (candidate.length < 3 || candidate.length > 50) {
      return 'URL identifier must be between 3 and 50 characters';
    }

    if (!URL_PATTERN.test(candidate)) {
      return 'Use only letters, numbers, hyphens, and underscores';
    }

    return '';
  };

  const handleSave = async () => {
    if (!isOwner) {
      setError('Only notebook owners can personalize URL identifiers');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${config.apiUrl}/api/notebooks/${notebookId}/url`,
        { urlIdentifier: urlIdentifier.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedIdentifier = response.data?.urlIdentifier || urlIdentifier.trim();
      onUpdated?.(updatedIdentifier);
      onClose?.();
    } catch (err) {
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonalizeIcon fontSize="small" />
        Personalize Notebook URL
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a memorable URL for sharing. This changes the notebook link everywhere.
        </Typography>

        {!isOwner && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Only notebook owners can change URL identifiers.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="URL Identifier"
          value={urlIdentifier}
          onChange={(e) => {
            setUrlIdentifier(e.target.value);
            if (error) {
              setError('');
            }
          }}
          disabled={!isOwner || saving}
          helperText="3-50 chars, letters/numbers/hyphen/underscore"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Preview"
          value={shareUrl}
          InputProps={{ readOnly: true }}
          size="small"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !isOwner || !notebookId}
        >
          {saving ? 'Saving...' : 'Save URL'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotebookUrlSettingsDialog;
