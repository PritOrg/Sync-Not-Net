/**
 * Share Dialog Component
 * Phase 5: Share Dialog with QR Code
 * 
 * Features:
 * - QR code generation for easy mobile sharing
 * - Copy link functionality with visual feedback
 * - Permission preview
 * - Social share options placeholder
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Paper,
  Tooltip,
  Chip,
  Divider,
  useTheme,
  alpha,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  People as PeopleIcon,
  Public as PublicIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import config from '../config';
import apiErrorHandler from '../utils/errorHandler';

// Permission info component
const PermissionBadge = ({ permission }) => {
  const config = {
    everyone: { label: 'Public', icon: <PublicIcon />, color: 'success' },
    collaborators: { label: 'Collaborators', icon: <PeopleIcon />, color: 'warning' },
    private: { label: 'Private', icon: <LockIcon />, color: 'error' },
  };

  const { label, icon, color } = config[permission] || config.everyone;

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size="small"
      sx={{ borderRadius: 1.5 }}
    />
  );
};

// Tab panel component
const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const ShareDialog = ({
  open,
  onClose,
  notebookId,
  notebookTitle = 'Untitled Notebook',
  urlIdentifier,
  permissions = 'everyone',
  isOwner = true,
  onOpenUrlSettings,
  onUrlUpdated,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestedAccess, setRequestedAccess] = useState('write');
  const [hasRequested, setHasRequested] = useState(false);
  const [urlDraft, setUrlDraft] = useState(urlIdentifier || notebookId || '');
  const [urlSaving, setUrlSaving] = useState(false);

  useEffect(() => {
    setUrlDraft(urlIdentifier || notebookId || '');
  }, [urlIdentifier, notebookId, open]);

  const effectiveUrlIdentifier = useMemo(
    () => (urlDraft || urlIdentifier || notebookId || '').trim(),
    [urlDraft, urlIdentifier, notebookId]
  );

  // Generate share URL
  const shareUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/Notebook/${effectiveUrlIdentifier}`;
  }, [effectiveUrlIdentifier]);

  const handleUpdateUrlQuick = useCallback(async () => {
    if (!isOwner || !notebookId) return;

    const trimmedIdentifier = (urlDraft || '').trim();
    if (!trimmedIdentifier) {
      setSnackbar({ open: true, message: 'URL identifier is required', severity: 'error' });
      return;
    }

    try {
      setUrlSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${config.apiUrl}/api/notebooks/${notebookId}/url`,
        { urlIdentifier: trimmedIdentifier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedIdentifier = response.data?.urlIdentifier || trimmedIdentifier;
      setUrlDraft(updatedIdentifier);
      onUrlUpdated?.(updatedIdentifier);
      setSnackbar({ open: true, message: 'URL updated successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: apiErrorHandler.getErrorMessage(err), severity: 'error' });
    } finally {
      setUrlSaving(false);
    }
  }, [isOwner, notebookId, onUrlUpdated, urlDraft]);

  // Handle copy to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to copy link', severity: 'error' });
    }
  }, [shareUrl]);

  // Handle social share
  const handleSocialShare = useCallback((platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(`Check out this notebook: ${notebookTitle}`);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  }, [shareUrl, notebookTitle]);

  // Handle collaboration request
  const handleRequestCollaboration = useCallback(async () => {
    if (!notebookId) return;
    try {
      setRequesting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/api/collaboration-requests/send`,
        {
          notebookId,
          message: requestMessage,
          requestedAccess,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasRequested(true);
      setSnackbar({ open: true, message: 'Collaboration request sent!', severity: 'success' });
    } catch (err) {
      const errorMsg = apiErrorHandler.getErrorMessage(err);
      if (errorMsg.includes('already sent') || errorMsg.includes('Already')) {
        setHasRequested(true);
        setSnackbar({ open: true, message: 'Request already sent', severity: 'info' });
      } else {
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    } finally {
      setRequesting(false);
    }
  }, [notebookId, requestMessage, requestedAccess]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: motion.div,
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.9, opacity: 0 },
          sx: { borderRadius: 3 },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
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
              <ShareIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Share Notebook
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notebookTitle}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            {isOwner ? (
              <>
                <Tab
                  icon={<QrCodeIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="QR Code"
                  sx={{ textTransform: 'none', minHeight: 48 }}
                />
                <Tab
                  icon={<LinkIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Link"
                  sx={{ textTransform: 'none', minHeight: 48 }}
                />
                <Tab
                  icon={<ShareIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Social"
                  sx={{ textTransform: 'none', minHeight: 48 }}
                />
              </>
            ) : (
              <Tab
                icon={<SendIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Request Access"
                sx={{ textTransform: 'none', minHeight: 48 }}
              />
            )}
          </Tabs>
        </Box>

        <DialogContent sx={{ pt: 2 }}>
          {isOwner ? (
            <>
              {/* QR Code Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 2,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha('#000', 0.08)}`,
                      bgcolor: '#fff',
                    }}
                  >
                    <QRCodeSVG
                      value={shareUrl}
                      size={200}
                      level="H"
                      includeMargin
                      bgColor="#ffffff"
                      fgColor="#1e293b"
                    />
                  </Paper>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Scan this QR code with your phone to open the notebook
                  </Typography>
                </Box>
              </TabPanel>

              {/* Link Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Share Link
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      value={shareUrl}
                      InputProps={{
                        readOnly: true,
                        sx: { borderRadius: 2, bgcolor: alpha('#f8fafc', 0.8) },
                      }}
                      size="small"
                    />

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${alpha('#000', 0.08)}`,
                      mb: 3,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Personalize URL
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      Make your notebook link easier to remember.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        disabled={!isOwner || urlSaving}
                        placeholder="my-team-notes"
                        helperText="3-50 chars, letters/numbers/hyphen/underscore"
                      />
                      <Button
                        variant="outlined"
                        onClick={handleUpdateUrlQuick}
                        disabled={!isOwner || urlSaving || !notebookId}
                        sx={{ minWidth: 110 }}
                      >
                        {urlSaving ? 'Saving...' : 'Update'}
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => onOpenUrlSettings?.()}
                        disabled={!isOwner || !onOpenUrlSettings}
                      >
                        Advanced URL settings
                      </Button>
                    </Box>
                  </Box>
                    <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                      <Button
                        variant="contained"
                        onClick={handleCopyLink}
                        startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                        sx={{ borderRadius: 2, minWidth: 100 }}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Permission info */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    border: `1px solid ${alpha('#000', 0.06)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Access Level</Typography>
                    <PermissionBadge permission={permissions} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {permissions === 'everyone' && 'Anyone with this link can view this notebook'}
                    {permissions === 'collaborators' && 'Only collaborators can access this notebook'}
                    {permissions === 'private' && 'Only you can access this notebook'}
                  </Typography>
                </Box>
              </TabPanel>

              {/* Social Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Share via
                </Typography>
                <List sx={{ bgcolor: 'transparent' }}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSocialShare('twitter')}
                      sx={{ borderRadius: 2, mb: 1 }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: '#1DA1F2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <TwitterIcon />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Twitter" secondary="Share on Twitter" />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSocialShare('linkedin')}
                      sx={{ borderRadius: 2, mb: 1 }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: '#0077B5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <LinkedInIcon />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="LinkedIn" secondary="Share on LinkedIn" />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSocialShare('whatsapp')}
                      sx={{ borderRadius: 2, mb: 1 }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: '#25D366',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <WhatsAppIcon />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="WhatsApp" secondary="Share via WhatsApp" />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSocialShare('email')}
                      sx={{ borderRadius: 2 }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <EmailIcon />
                        </Box>
                      </ListItemIcon>
                      <ListItemText primary="Email" secondary="Share via email" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </TabPanel>
            </>
          ) : (
            /* Non-owner: Request to Collaborate */
            <Box sx={{ py: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Request to Collaborate
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Send a request to the owner of "{notebookTitle}" to become a collaborator.
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Requested Access Level
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['read', 'write', 'admin'].map((level) => (
                    <Chip
                      key={level}
                      label={level === 'read' ? 'View Only' : level === 'write' ? 'Can Edit' : 'Admin'}
                      onClick={() => setRequestedAccess(level)}
                      color={requestedAccess === level ? 'primary' : 'default'}
                      variant={requestedAccess === level ? 'filled' : 'outlined'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))}
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a message (optional)..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={requesting ? <CircularProgress size={20} color="inherit" /> : (hasRequested ? <CheckIcon /> : <SendIcon />)}
                onClick={handleRequestCollaboration}
                disabled={requesting || hasRequested}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  background: hasRequested
                    ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                }}
              >
                {requesting ? 'Sending...' : hasRequested ? 'Request Sent' : 'Send Request'}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha('#000', 0.08)}` }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
          {isOwner && (
            <Button
              onClick={handleCopyLink}
              variant="contained"
              startIcon={<CopyIcon />}
              sx={{ borderRadius: 2 }}
            >
              Copy Link
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareDialog;
