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
import React, { useState, useMemo, useCallback } from 'react';
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

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
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Generate share URL
  const shareUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/Notebook/${urlIdentifier}`;
  }, [urlIdentifier]);

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
          </Tabs>
        </Box>

        <DialogContent sx={{ pt: 2 }}>
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
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha('#000', 0.08)}` }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="contained"
            startIcon={<CopyIcon />}
            sx={{ borderRadius: 2 }}
          >
            Copy Link
          </Button>
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
