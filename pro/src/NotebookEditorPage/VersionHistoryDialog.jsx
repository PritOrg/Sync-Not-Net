import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
  Stack,
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Compare as CompareIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Version item component
const VersionItem = ({ version, isSelected, isCurrent, onSelect, onRestore, restoring, isOwner }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: isSelected ? 'primary.main' : alpha('#000', 0.06),
          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: isSelected ? 'primary.main' : alpha('#000', 0.15),
            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : alpha('#f8fafc', 0.8),
          },
        }}
        onClick={() => onSelect(version.id)}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Selection indicator */}
          <Box sx={{ pt: 0.5 }}>
            {isSelected ? (
              <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
            )}
          </Box>

          {/* Version info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Version {version.version}
              </Typography>
              {isCurrent && (
                <Chip
                  label="Current"
                  size="small"
                  color="success"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                />
              )}
            </Box>

            {/* Metadata */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
              {version.createdBy && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {version.createdBy.name || 'Unknown'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Changes description */}
            {version.changes && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 1,
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {version.changes}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {!isCurrent && isOwner && (
              <Tooltip title="Restore to this version" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(version.id);
                    }}
                    disabled={restoring}
                    sx={{
                      color: 'primary.main',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                    }}
                  >
                    {restoring ? <CircularProgress size={18} /> : <RestoreIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

const VersionHistoryDialog = ({ open, onClose, notebookId, onVersionRestore, onCompareVersions }) => {
  const theme = useTheme();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [restoring, setRestoring] = useState(false);

  // Fetch versions
  useEffect(() => {
    if (open && notebookId) {
      fetchVersions();
    }
  }, [open, notebookId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/notebooks/${notebookId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVersions(response.data.versions || []);
    } catch (err) {
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  // Toggle version selection
  const handleToggleVersion = (versionId) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  // Handle restore
  const handleRestore = async (versionId) => {
    const version = versions.find((v) => v.id === versionId);
    const versionLabel = version ? `v${version.version}` : 'this version';

    const result = await Swal.fire({
      title: 'Restore Version?',
      text: `Are you sure you want to restore to ${versionLabel}? Current content will be saved as a new version.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      setRestoring(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/notebooks/${notebookId}/versions/${versionId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        title: 'Restored!',
        text: `Successfully restored to ${versionLabel}.`,
        icon: 'success',
        confirmButtonColor: '#6366f1',
      });

      if (onVersionRestore) onVersionRestore(versionId);
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to restore version. Please try again.',
        icon: 'error',
      });
    } finally {
      setRestoring(false);
    }
  };

  // Handle compare
  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      const sorted = [...selectedVersions].sort((a, b) => {
        const vA = versions.find((v) => v.id === a);
        const vB = versions.find((v) => v.id === b);
        return new Date(vA.createdAt) - new Date(vB.createdAt);
      });
      onCompareVersions(sorted[0], sorted[1]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: alpha('#000', 0.08),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HistoryIcon color="primary" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Version History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {versions.length} versions
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : versions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">No version history available.</Typography>
          </Box>
        ) : (
          <Box>
            {/* Compare action bar */}
            <AnimatePresence>
              {selectedVersions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderBottom: '1px solid',
                      borderColor: alpha('#000', 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {selectedVersions.length} version{selectedVersions.length > 1 ? 's' : ''} selected
                    </Typography>
                    <Button
                      startIcon={<CompareIcon />}
                      onClick={handleCompare}
                      disabled={selectedVersions.length !== 2}
                      variant="contained"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Compare
                    </Button>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Versions list */}
            <Box sx={{ p: 2 }}>
              {versions.map((version, index) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersions.includes(version.id)}
                  isCurrent={index === 0}
                  onSelect={handleToggleVersion}
                  onRestore={handleRestore}
                  restoring={restoring}
                  isOwner={true} // Should check actual ownership
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: alpha('#000', 0.08) }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;
