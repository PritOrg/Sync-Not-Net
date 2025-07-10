import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  LinearProgress,
  Breadcrumbs,
  Link,
  Avatar,
  AvatarGroup,
  Badge,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save,
  Settings,
  Share,
  Download,
  Upload,
  Fullscreen,
  FullscreenExit,
  Preview,
  Code,
  Article,
  History,
  People,
  Bookmark,
  BookmarkBorder,
  Edit,
  ExpandMore,
  Close,
  Add,
  Delete,
  Visibility,
  VisibilityOff,
  Lock,
  Public,
  AutoMode,
  SmartToy,
  CloudUpload,
  RestartAlt,
  Schedule,
  NavigateNext,
  Home,
  MenuBook,
  Comment,
  Notifications,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  Palette,
  TextFields,
  FormatSize,
  ZoomIn,
  ZoomOut,
  DarkMode,
  LightMode,
  Split,
  ViewSidebar,
  ViewColumn
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import EnhancedEditor from '../Components/EnhancedEditor';
import UserPresence from '../Components/UserPresence';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const EnhancedNotebookEditor = () => {
  const { urlIdentifier } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const socketRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Core state
  const [notebook, setNotebook] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [accessLevel, setAccessLevel] = useState('read');
  const [userRole, setUserRole] = useState('');

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Collaboration state
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [userCursors, setUserCursors] = useState({});
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  // Editor state
  const [editorMode, setEditorMode] = useState('quill');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // Dialogs and modals
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);

  // SpeedDial actions
  const speedDialActions = [
    { icon: <Save />, name: 'Save', action: () => handleSave() },
    { icon: <Share />, name: 'Share', action: () => setShareDialogOpen(true) },
    { icon: <Download />, name: 'Download', action: () => handleDownload() },
    { icon: <History />, name: 'History', action: () => setHistoryOpen(true) },
    { icon: <Settings />, name: 'Settings', action: () => setSettingsOpen(true) }
  ];

  useEffect(() => {
    fetchNotebook();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [urlIdentifier]);

  useEffect(() => {
    // Auto-save functionality
    if (hasUnsavedChanges && notebook?.autoSave && accessLevel === 'edit') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 2000);
    }
  }, [content, hasUnsavedChanges, notebook?.autoSave, accessLevel]);

  useEffect(() => {
    // Update statistics
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(text.length);
    setReadingTime(Math.ceil(words.length / 200)); // Assuming 200 WPM reading speed
  }, [content]);

  const fetchNotebook = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/api/notebooks/${urlIdentifier}/access`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { notebook: notebookData, accessLevel: access, userRole: role } = response.data;
      
      setNotebook(notebookData);
      setContent(notebookData.content || '');
      setAccessLevel(access);
      setUserRole(role);
      setEditorMode(notebookData.editorMode || 'quill');
      setLastSaved(new Date(notebookData.updatedAt));
      
      // Initialize Socket.IO connection
      initializeSocket(notebookData._id, token);
      
      // Check if bookmarked
      checkBookmarkStatus();

    } catch (error) {
      console.error('Error fetching notebook:', error);
      setError('Failed to load notebook');
      
      if (error.response?.status === 401) {
        navigate('/auth?mode=login');
      } else if (error.response?.status === 404) {
        navigate('/notebooks');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = (notebookId, token) => {
    socketRef.current = io(API_BASE_URL, {
      auth: { token }
    });

    socketRef.current.emit('join-notebook', notebookId);

    socketRef.current.on('user-joined', (users) => {
      setConnectedUsers(users);
    });

    socketRef.current.on('user-left', (users) => {
      setConnectedUsers(users);
    });

    socketRef.current.on('content-change', (data) => {
      if (data.userId !== getUserId()) {
        setContent(data.content);
      }
    });

    socketRef.current.on('cursor-position', (data) => {
      setUserCursors(prev => ({
        ...prev,
        [data.userId]: data.position
      }));
    });

    socketRef.current.on('notebook-saved', () => {
      setLastSaved(new Date());
      setSaving(false);
      setHasUnsavedChanges(false);
    });
  };

  const getUserId = () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);

    // Emit content change to other users
    if (socketRef.current && accessLevel === 'edit') {
      socketRef.current.emit('content-change', {
        notebookId: notebook._id,
        content: newContent,
        userId: getUserId()
      });
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (accessLevel !== 'edit') return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      await axios.put(`${API_BASE_URL}/api/notebooks/${urlIdentifier}`, {
        content,
        lastModified: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      if (!isAutoSave) {
        setSnackbar({
          open: true,
          message: 'Notebook saved successfully',
          severity: 'success'
        });
      }

      // Emit save event to other users
      if (socketRef.current) {
        socketRef.current.emit('notebook-saved', {
          notebookId: notebook._id,
          userId: getUserId()
        });
      }

    } catch (error) {
      console.error('Error saving notebook:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save notebook',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${notebook?.title || 'notebook'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const checkBookmarkStatus = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked-notebooks') || '[]');
    setIsBookmarked(bookmarks.includes(notebook?._id));
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked-notebooks') || '[]');
    let newBookmarks;

    if (isBookmarked) {
      newBookmarks = bookmarks.filter(id => id !== notebook._id);
    } else {
      newBookmarks = [...bookmarks, notebook._id];
    }

    localStorage.setItem('bookmarked-notebooks', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);

    setSnackbar({
      open: true,
      message: isBookmarked ? 'Bookmark removed' : 'Notebook bookmarked',
      severity: 'success'
    });
  };

  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <LinearProgress sx={{ width: 300 }} />
        <Typography>Loading notebook...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/notebooks')}>
          Back to Notebooks
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 2,
          py: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
              <Link 
                color="inherit" 
                onClick={() => navigate('/notebooks')}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Home fontSize="small" />
                Notebooks
              </Link>
              <Typography color="text.primary" sx={{ fontWeight: 'medium' }}>
                {notebook?.title || 'Untitled'}
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Center - Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {saving && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress size={16} />
                <Typography variant="caption">Saving...</Typography>
              </Box>
            )}
            
            {hasUnsavedChanges && !saving && (
              <Chip 
                label="Unsaved changes" 
                size="small" 
                color="warning" 
                variant="outlined" 
              />
            )}

            <Typography variant="caption" color="text.secondary">
              Last saved: {formatLastSaved()}
            </Typography>

            {/* Connected users */}
            {connectedUsers.length > 0 && (
              <UserPresence users={connectedUsers} />
            )}
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
              <IconButton onClick={toggleBookmark} size="small">
                {isBookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Statistics">
              <Button
                size="small"
                variant="outlined"
                sx={{ borderRadius: 2 }}
                onClick={() => setSidebarOpen(true)}
              >
                {wordCount} words
              </Button>
            </Tooltip>

            <Tooltip title={previewMode ? 'Edit mode' : 'Preview mode'}>
              <IconButton 
                onClick={() => setPreviewMode(!previewMode)}
                color={previewMode ? 'primary' : 'default'}
                size="small"
              >
                {previewMode ? <Edit /> : <Preview />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <IconButton onClick={handleFullscreenToggle} size="small">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>

            {accessLevel === 'edit' && (
              <Button
                variant="contained"
                onClick={() => handleSave()}
                disabled={saving || !hasUnsavedChanges}
                startIcon={<Save />}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Save
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {accessLevel === 'read' && (
            <Alert severity="info" sx={{ m: 1, borderRadius: 2 }}>
              You are viewing this notebook in read-only mode.
            </Alert>
          )}

          <Box sx={{ flex: 1, p: 2 }}>
            <EnhancedEditor
              content={content}
              onChange={handleContentChange}
              editorMode={editorMode}
              readOnly={accessLevel === 'read'}
              fontSize={fontSize}
              darkMode={isDarkMode}
              splitView={splitView}
              previewMode={previewMode}
            />
          </Box>
        </Box>

        {/* Comments sidebar */}
        {showComments && (
          <Paper 
            sx={{ 
              width: 300, 
              borderLeft: `1px solid ${theme.palette.divider}`,
              borderRadius: 0
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6">Comments</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No comments yet
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      {/* SpeedDial for mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
            />
          ))}
        </SpeedDial>
      )}

      {/* Sidebar */}
      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Document Statistics
          </Typography>
          
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {wordCount}
                  </Typography>
                  <Typography variant="caption">Words</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="secondary">
                    {characterCount}
                  </Typography>
                  <Typography variant="caption">Characters</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="success.main">
                    {readingTime}
                  </Typography>
                  <Typography variant="caption">Min read</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="warning.main">
                    {notebook?.version || 1}
                  </Typography>
                  <Typography variant="caption">Version</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Display Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={(e) => setIsDarkMode(e.target.checked)}
                  />
                }
                label="Dark mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={splitView}
                    onChange={(e) => setSplitView(e.target.checked)}
                  />
                }
                label="Split view"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showComments}
                    onChange={(e) => setShowComments(e.target.checked)}
                  />
                }
                label="Show comments"
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Font Size</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                  >
                    <ZoomOut />
                  </IconButton>
                  <Typography variant="body2">{fontSize}px</Typography>
                  <IconButton 
                    size="small"
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  >
                    <ZoomIn />
                  </IconButton>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Notifications</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                }
                label="Enable notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                }
                label="Sound effects"
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      </Drawer>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Notebook Settings</DialogTitle>
        <DialogContent>
          {/* Settings content will be similar to SettingsDialog */}
          <Typography>Settings panel coming soon...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Notebook</DialogTitle>
        <DialogContent>
          <Typography>Share functionality coming soon...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default EnhancedNotebookEditor;
