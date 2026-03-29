import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useBeforeUnload } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Chip,
  Avatar,
  AvatarGroup,
  Badge,
  LinearProgress,
  CircularProgress,
  Skeleton,
  useTheme,
  alpha,
  Drawer,
  Portal,
  Backdrop,
  Snackbar,
  Alert,
  Fade,
  Grow,
  Slide,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  AutoMode as AutoSaveIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  AccessTime as ClockIcon,
  CloudSync as CloudSyncIcon,
  CloudOff as CloudOffIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
  Keyboard as KeyboardIcon,
  History as HistoryIcon,
  Lock as LockIcon,
  Comment as CommentIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  AutoFixHigh as PersonalizeIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  Tune as TuneIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedEditor from '../Components/EnhancedEditor';
import EnhancedUserPresence from '../Components/EnhancedUserPresence';
import VersionHistoryDialog from './VersionHistoryDialog';
import VersionComparisonDialog from './VersionComparisonDialog';
import CommentsPanel from './CommentsPanel';
import PasswordSettingsDialog from './PasswordSettingsDialog';
import PermissionsSettingsDialog from './PermissionsSettingsDialog';
import CollaboratorsSettingsDialog from './CollaboratorsSettingsDialog';
import DeleteNotebookDialog from '../Components/DeleteNotebookDialog';
import KeyboardShortcutsDialog from '../Components/KeyboardShortcutsDialog';
import ErrorBoundary from '../Components/ErrorBoundary';
import socketClient from '../utils/socketClient';
import { processContentFromBackend, prepareContentForBackend } from '../utils/contentUtils';
import ShareDialog from './ShareDialog';
import NotebookUrlSettingsDialog from './NotebookUrlSettingsDialog';
import UnifiedAccessPrompt from './UnifiedAccessPrompt';
import Swal from 'sweetalert2';
import axios from 'axios';
import config from '../config';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const slideInRight = {
  initial: { x: 400, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
  exit: { x: 400, opacity: 0, transition: { duration: 0.2 } },
};

const fadeInUp = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Status indicator component
const ConnectionStatus = ({ isConnected, connectionError }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', damping: 15 }}
  >
    <Tooltip title={isConnected ? 'Connected' : connectionError || 'Disconnected'}>
      <Chip
        icon={
          isConnected ? (
            <CloudSyncIcon sx={{ fontSize: 16 }} />
          ) : (
            <CloudOffIcon sx={{ fontSize: 16, color: 'error.main' }} />
          )
        }
        label={isConnected ? 'Live' : 'Offline'}
        size="small"
        color={isConnected ? 'success' : 'error'}
        variant="outlined"
        sx={{
          borderRadius: 2,
          fontWeight: 600,
          '& .MuiChip-icon': { ml: 0.5 },
        }}
      />
    </Tooltip>
  </motion.div>
);

// Auto-save indicator
const AutoSaveStatus = ({ isSaving, lastSavedTime, hasUnsavedChanges }) => {
  const getStatus = () => {
    if (isSaving) return { text: 'Saving...', color: 'warning', icon: <CircularProgress size={14} /> };
    if (hasUnsavedChanges) return { text: 'Unsaved changes', color: 'warning', icon: <DotIcon sx={{ fontSize: 8 }} /> };
    if (lastSavedTime) {
      const timeAgo = Math.round((Date.now() - lastSavedTime.getTime()) / 1000);
      if (timeAgo < 60) return { text: 'Saved just now', color: 'success', icon: <DotIcon sx={{ fontSize: 8 }} /> };
      if (timeAgo < 3600) return { text: `Saved ${Math.floor(timeAgo / 60)}m ago`, color: 'success', icon: <DotIcon sx={{ fontSize: 8 }} /> };
      return { text: `Saved ${Math.floor(timeAgo / 3600)}h ago`, color: 'success', icon: <DotIcon sx={{ fontSize: 8 }} /> };
    }
    return { text: 'Not saved', color: 'default', icon: <DotIcon sx={{ fontSize: 8 }} /> };
  };

  const status = getStatus();

  return (
    <Chip
      icon={status.icon}
      label={status.text}
      size="small"
      color={status.color}
      variant="filled"
      sx={{
        borderRadius: 2,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 28,
        '& .MuiChip-icon': { ml: 0.5 },
      }}
    />
  );
};

// Active users display
const ActiveUsersBar = ({ users, currentUser }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.875rem' } }}>
      {users.map((user, idx) => (
        <Tooltip key={user.id || idx} title={user.name || 'Anonymous'}>
          <Avatar
            sx={{
              bgcolor: `hsl(${(user.id || 0) * 60}, 70%, 50%)`,
              border: user.id === currentUser?.id ? '2px solid' : 'none',
              borderColor: 'primary.main',
            }}
          >
            {(user.name || 'A')[0].toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
    {users.length > 0 && (
      <Typography variant="caption" color="text.secondary">
        {users.length} online
      </Typography>
    )}
  </Box>
);

// Main toolbar component
const EditorToolbar = ({
  title,
  onTitleChange,
  isSaving,
  lastSavedTime,
  hasUnsavedChanges,
  isConnected,
  connectionError,
  activeUsers,
  currentUser,
  onBack,
  onSettings,
  onShare,
  onHistory,
  onComments,
  onCollaborators,
  onPassword,
  onPermissions,
  onUrlSettings,
  onDelete,
  onKeyboardShortcuts,
  onSave,
  userRole,
  readOnly,
}) => {
  const theme = useTheme();

  return (
    <Paper
      component={motion.div}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, md: 3 },
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.5),
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 2,
      }}
    >
      {/* Left section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
        <Tooltip title="Back to notebooks">
          <IconButton onClick={onBack} size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Notebook"
            readOnly={readOnly}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '1.25rem',
              fontWeight: 600,
              background: 'transparent',
              color: theme.palette.text.primary,
              padding: '4px 0',
            }}
          />
        </Box>
      </Box>

      {/* Center section - Status */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
        <AutoSaveStatus
          isSaving={isSaving}
          lastSavedTime={lastSavedTime}
          hasUnsavedChanges={hasUnsavedChanges}
        />
        <ConnectionStatus isConnected={isConnected} connectionError={connectionError} />
      </Box>

      {/* Right section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Active users */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', mr: 1 }}>
          <ActiveUsersBar users={activeUsers} currentUser={currentUser} />
        </Box>

        {/* Action buttons */}
        <Tooltip title="Save (Ctrl+S)">
          <span>
            <IconButton
              onClick={onSave}
              disabled={isSaving || readOnly}
              size="small"
              color={hasUnsavedChanges ? 'warning' : 'default'}
            >
              {isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Comments">
          <IconButton onClick={onComments} size="small">
            <Badge badgeContent={0} color="primary">
              <CommentIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Version History">
          <IconButton onClick={onHistory} size="small">
            <HistoryIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share">
          <IconButton onClick={onShare} size="small">
            <ShareIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Settings menu */}
        <Tooltip title="Settings">
          <IconButton onClick={onSettings} size="small">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

// Settings drawer content
const SettingsDrawerContent = ({
  onClose,
  onCollaborators,
  onPassword,
  onPermissions,
  onUrlSettings,
  onDelete,
  onKeyboardShortcuts,
  userRole,
  editorMode,
  onEditorModeChange,
  language,
  onLanguageChange,
}) => {
  const theme = useTheme();

  const menuItems = [
    {
      section: 'Editor',
      items: [
        { icon: <EditIcon />, label: 'Rich Text Mode', onClick: () => onEditorModeChange('quill'), active: editorMode === 'quill' },
        { icon: <CodeIcon />, label: 'Code Mode', onClick: () => onEditorModeChange('code'), active: editorMode === 'code' },
      ],
    },
    {
      section: 'Collaboration',
      items: [
        { icon: <PeopleIcon />, label: 'Collaborators', onClick: onCollaborators },
        { icon: <LockIcon />, label: 'Password Protection', onClick: onPassword },
        { icon: <VisibilityIcon />, label: 'Permissions', onClick: onPermissions },
        { icon: <PersonalizeIcon />, label: 'Personalize URL', onClick: onUrlSettings },
      ],
    },
    {
      section: 'Help',
      items: [
        { icon: <KeyboardIcon />, label: 'Keyboard Shortcuts', onClick: onKeyboardShortcuts },
      ],
    },
  ];

  if (userRole === 'owner') {
    menuItems.push({
      section: 'Danger Zone',
      items: [
        { icon: <DeleteNotebookDialog />, label: 'Delete Notebook', onClick: onDelete, danger: true },
      ],
    });
  }

  return (
    <Box sx={{ width: 320, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>Settings</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {menuItems.map((section, idx) => (
        <Box key={idx} sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', mb: 1, fontWeight: 600 }}
          >
            {section.section}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {section.items.map((item, itemIdx) => (
              <Button
                key={itemIdx}
                startIcon={item.icon}
                onClick={() => { if (typeof item.onClick === 'function') { item.onClick(); } if (typeof onClose === 'function') { onClose(); } }}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  color: item.danger ? 'error.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: item.danger
                      ? alpha(theme.palette.error.main, 0.08)
                      : alpha(theme.palette.primary.main, 0.08),
                  },
                  ...(item.active && {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                  }),
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// Main component
const EnhancedNotebookEditor = ({ mode = 'view' }) => {
  const { urlIdentifier: urlIdentifier_from_url } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // Core state
  const [isLoading, setIsLoading] = useState(mode !== 'new');
  const [urlIdentifier, setUrlIdentifier] = useState(urlIdentifier_from_url);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(mode === 'new' ? 'Untitled Notebook' : '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorMode, setEditorMode] = useState('quill');
  const [language, setLanguage] = useState('javascript');
  const [notebookData, setNotebookData] = useState(mode === 'new' ? {} : {});
  const [isNewNotebook, setIsNewNotebook] = useState(mode === 'new');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [autoSave, setAutoSave] = useState(true);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isVersionComparisonOpen, setIsVersionComparisonOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ oldId: null, newId: null });
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  const [isCollaboratorsSettingsOpen, setIsCollaboratorsSettingsOpen] = useState(false);
  const [isPasswordSettingsOpen, setIsPasswordSettingsOpen] = useState(false);
  const [isPermissionsSettingsOpen, setIsPermissionsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUrlSettingsOpen, setIsUrlSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Access state
  const [userRole, setUserRole] = useState('viewer');
  const [accessLevel, setAccessLevel] = useState('read');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Guest and password access state
  const [requiresGuestName, setRequiresGuestName] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [guestInfo, setGuestInfo] = useState(() => {
    const savedGuest = localStorage.getItem('guestInfo');
    return savedGuest ? JSON.parse(savedGuest) : null;
  });
  const [accessError, setAccessError] = useState('');
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);

  // Conflict state (Phase 6 placeholder)
  const [conflictData, setConflictData] = useState(null);

  // Notification state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Refs
  const saveTimer = useRef(null);
  const lastSavedContent = useRef('');

  const showNotification = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Register as guest user
  const registerGuest = useCallback(async (guestName, urlId) => {
    if (!guestName || !urlId) throw new Error('Missing guest name or notebook identifier');
    const response = await fetch(`${config.apiUrl}/api/notebooks/${urlId}/register-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to register guest');
    }
    return await response.json();
  }, []);

  // Verify notebook password
  const verifyPassword = useCallback(async (urlId, password) => {
    if (!password || !urlId) throw new Error('Missing password or notebook identifier');
    
    // Get guest info if available
    const guestData = localStorage.getItem('guestInfo');
    const guestInfo = guestData ? JSON.parse(guestData) : null;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Include auth token so backend can identify the user
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Include guest info in request
    const body = { password };
    if (guestInfo) {
      headers['X-Guest-Id'] = guestInfo.id;
      headers['X-Guest-Name'] = guestInfo.name;
    }
    
    const response = await fetch(`${config.apiUrl}/api/notebooks/${urlId}/verify-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to verify password');
    }
    return await response.json();
  }, []);

  // Handle guest name submission
  const handleGuestNameSubmit = useCallback(async (guestName) => {
    setIsVerifyingAccess(true);
    setAccessError('');
    try {
      const result = await registerGuest(guestName, urlIdentifier_from_url);
      
      // Save guest info
      const guestData = result.guestUser || result;
      setGuestInfo(guestData);
      localStorage.setItem('guestInfo', JSON.stringify(guestData));
      
      // Check if password is required
      if (result.requiresPassword) {
        setRequiresGuestName(false);
        setRequiresPassword(true);
        setIsLoading(false);
        return;
      }
      
      // Load notebook data
      setRequiresGuestName(false);
      loadNotebookFromResponse(result);
    } catch (error) {
      console.error('Guest registration error:', error);
      setAccessError(error.message || 'Failed to register as guest');
    } finally {
      setIsVerifyingAccess(false);
    }
  }, [urlIdentifier_from_url, registerGuest]);

  // Handle password submission
  const handlePasswordSubmit = useCallback(async (password) => {
    setIsVerifyingAccess(true);
    setAccessError('');
    try {
      const result = await verifyPassword(urlIdentifier_from_url, password);
      
      // Save password verification token if provided
      if (result.token) {
        localStorage.setItem('passwordToken', result.token);
      }
      
      // Load notebook data
      setRequiresPassword(false);
      loadNotebookFromResponse(result);
    } catch (error) {
      console.error('Password verification error:', error);
      setAccessError(error.message || 'Invalid password');
    } finally {
      setIsVerifyingAccess(false);
    }
  }, [urlIdentifier_from_url, verifyPassword]);

  // Load notebook data from API response
  const loadNotebookFromResponse = useCallback((data) => {
    const notebook = data.notebook || data;
    
    setNotebookData(notebook);
    setTitle(notebook.title || '');
    setContent(processContentFromBackend(notebook.content) || '');
    setEditorMode(notebook.editorMode || 'quill');
    setLanguage(notebook.language || 'javascript');
    setAutoSave(notebook.autoSave ?? true);
    setUserRole(notebook.userRole || data.userRole || 'guest');
    setAccessLevel(notebook.accessLevel || data.accessLevel || 'read');
    setUrlIdentifier(notebook.urlIdentifier);
    lastSavedContent.current = notebook.content;
    setIsNewNotebook(false);
    setIsLoading(false);

    // Join socket room
    const token = localStorage.getItem('token');
    if (socketClient.isConnected && notebook._id) {
      socketClient.joinNotebook(notebook._id, guestInfo);
    }
  }, [guestInfo]);

  // Fetch notebook data or create new
  const fetchNotebookData = useCallback(async () => {
    // For new notebooks, don't fetch
    if (mode === 'new') {
      setIsLoading(false);
      setUserRole('owner');
      setAccessLevel('owner');
      return;
    }

    if (!urlIdentifier_from_url) {
      setIsLoading(false);
      return;
    }
    
    // If we already have notebook data and aren't waiting for guest/password, skip refetch
    if (notebookData && !requiresGuestName && !requiresPassword) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const savedGuestInfo = localStorage.getItem('guestInfo');
      const parsedGuestInfo = savedGuestInfo ? JSON.parse(savedGuestInfo) : null;
      
      // Build headers
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add guest info if available
      if (parsedGuestInfo) {
        headers['X-Guest-Id'] = parsedGuestInfo.id;
        headers['X-Guest-Name'] = parsedGuestInfo.name;
      }

      const response = await fetch(`${config.apiUrl}/api/notebooks/${urlIdentifier_from_url}`, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication required
        if (response.status === 401) {
          // If we have error about guest name required, show guest prompt
          if (errorData.message?.includes('name') || errorData.message?.includes('guest')) {
            setRequiresGuestName(true);
            setIsLoading(false);
            return;
          }
          // Otherwise need to login
          showNotification('Please login to access this notebook', 'error');
          setIsLoading(false);
          navigate('/auth?mode=login');
          return;
        }
        
        // Handle access denied / password required
        if (response.status === 403) {
          if (errorData.requiresPassword || errorData.message?.includes('password')) {
            setRequiresPassword(true);
            setIsLoading(false);
            return;
          }
          showNotification(errorData.message || 'Access denied', 'error');
          setIsLoading(false);
          navigate('/notebooks');
          return;
        }
        
        if (response.status === 404) {
          showNotification('Notebook not found', 'error');
          setIsLoading(false);
          navigate('/notebooks');
          return;
        }
        
        throw new Error(errorData.message || 'Failed to load notebook');
      }

      const data = await response.json();
      
      // Check if password is required (200 OK but needs password)
      if (data.requiresPassword) {
        setTitle(data.notebook?.title || 'Notebook');
        setRequiresPassword(true);
        setIsLoading(false);
        return;
      }
      
      // Check if guest name is required (200 OK but needs guest name)
      if (data.requiresGuestName) {
        setTitle(data.notebook?.title || 'Notebook');
        setRequiresGuestName(true);
        setIsLoading(false);
        return;
      }
      
      loadNotebookFromResponse(data);
    } catch (error) {
      console.error('Error fetching notebook:', error);
      showNotification(error.message || 'Failed to load notebook', 'error');
      setIsLoading(false);
    }
  }, [urlIdentifier_from_url, mode, navigate, showNotification, loadNotebookFromResponse]);

  // Save notebook - handles both creating new and updating existing
  const saveNotebook = useCallback(async (manual = false) => {
    // For new notebooks, create first
    if (isNewNotebook || !notebookData?._id) {
      setIsSaving(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showNotification('Please login to save', 'error');
          navigate('/auth?mode=login');
          return;
        }

        const preparedContent = prepareContentForBackend(content);
        const newUrlIdentifier = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 
                                 `notebook-${Date.now()}`;

        const response = await fetch(`${config.apiUrl}/api/notebooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title || 'Untitled Notebook',
            content: preparedContent,
            editorMode,
            language,
            autoSave,
            urlIdentifier: newUrlIdentifier,
            permissions: 'everyone',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create notebook');
        }

        const data = await response.json();
        const notebook = data.notebook || data;
        
        setNotebookData(notebook);
        setUrlIdentifier(notebook.urlIdentifier);
        lastSavedContent.current = preparedContent;
        setLastSavedTime(new Date());
        setHasUnsavedChanges(false);
        setIsNewNotebook(false);
        setUserRole('owner');
        setAccessLevel('owner');

        showNotification('Notebook created successfully', 'success');
        
        // Navigate to the new notebook URL
        if (notebook.urlIdentifier) {
          navigate(`/Notebook/${notebook.urlIdentifier}`, { replace: true });
        }
      } catch (error) {
        console.error('Create error:', error);
        showNotification(error.message || 'Failed to create notebook', 'error');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // For existing notebooks, update
    if (!manual && content === lastSavedContent.current) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const preparedContent = prepareContentForBackend(content);

      const response = await fetch(`${config.apiUrl}/api/notebooks/${notebookData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title,
          content: preparedContent,
          editorMode,
          language,
          autoSave,
        }),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      lastSavedContent.current = preparedContent;
      setLastSavedTime(new Date());
      setHasUnsavedChanges(false);

      if (manual) showNotification('Saved successfully', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [notebookData?._id, content, title, editorMode, language, autoSave, showNotification, isNewNotebook, navigate]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !isSaving) {
      saveTimer.current = setTimeout(() => saveNotebook(false), 3000);
    }
    return () => clearTimeout(saveTimer.current);
  }, [autoSave, hasUnsavedChanges, isSaving, saveNotebook]);

  // Content change handler
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  // Socket setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(userInfo);
      socketClient.connect(token);
    }

    socketClient.on('connectionStatusChanged', (status) => {
      setIsConnected(status.connected);
      setConnectionError(status.reason || null);
    });

    socketClient.on('notebookUpdated', (data) => {
      if (data.updatedBy?.id !== currentUser?.id) {
        if (data.content) setContent(processContentFromBackend(data.content));
        if (data.title) setTitle(data.title);
        showNotification(`Updated by ${data.updatedBy?.name || 'another user'}`, 'info');
      }
    });

    socketClient.on('joinedNotebook', (data) => {
      setActiveUsers(data.currentUsers || []);
    });

    socketClient.on('userJoined', (data) => {
      setActiveUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
    });

    socketClient.on('userLeft', (data) => {
      setActiveUsers(prev => prev.filter(u => u.id !== data.user?.id));
    });

    return () => {
      socketClient.off('connectionStatusChanged');
      socketClient.off('notebookUpdated');
      socketClient.off('joinedNotebook');
      socketClient.off('userJoined');
      socketClient.off('userLeft');
    };
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchNotebookData();
  }, [fetchNotebookData]);

  // Warn before leaving with unsaved changes
  useBeforeUnload(
    useCallback((e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return 'You have unsaved changes.';
      }
    }, [hasUnsavedChanges])
  );

  const readOnly = accessLevel === 'read';
  const canEdit = accessLevel === 'write' || accessLevel === 'owner';

  // Show access prompts if needed
  if (requiresGuestName || requiresPassword) {
    return (
      <UnifiedAccessPrompt
        requiresGuestName={requiresGuestName}
        requiresPassword={requiresPassword}
        notebookTitle={title || 'Untitled Notebook'}
        creatorName={notebookData?.creator?.name || ''}
        onSubmitGuestName={handleGuestNameSubmit}
        onSubmitPassword={handlePasswordSubmit}
        loading={isVerifyingAccess}
        error={accessError}
      />
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Skeleton variant="rectangular" height={64} />
        <Box sx={{ flex: 1, p: 3 }}>
          <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box
        component={motion.div}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: alpha(theme.palette.background.default, 0.98),
        }}
      >
        {/* Toolbar */}
        <EditorToolbar
          title={title}
          onTitleChange={setTitle}
          isSaving={isSaving}
          lastSavedTime={lastSavedTime}
          hasUnsavedChanges={hasUnsavedChanges}
          isConnected={isConnected}
          connectionError={connectionError}
          activeUsers={activeUsers}
          currentUser={currentUser}
          onBack={() => navigate('/notebooks')}
          onSettings={() => setIsSettingsOpen(true)}
          onShare={() => setIsShareOpen(true)}
          onHistory={() => setIsVersionHistoryOpen(true)}
          onComments={() => setIsCommentsPanelOpen(true)}
          onCollaborators={() => setIsCollaboratorsSettingsOpen(true)}
          onPassword={() => setIsPasswordSettingsOpen(true)}
          onPermissions={() => setIsPermissionsSettingsOpen(true)}
          onUrlSettings={() => setIsUrlSettingsOpen(true)}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
          onSave={() => saveNotebook(true)}
          userRole={userRole}
          readOnly={readOnly}
        />

        {/* Saving indicator */}
        {isSaving && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 64,
              left: 0,
              right: 0,
              zIndex: 99,
            }}
          />
        )}

        {/* Main editor area */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <EnhancedEditor
            content={content}
            onChange={handleContentChange}
            onSave={() => saveNotebook(true)}
            editorMode={editorMode}
            onModeChange={setEditorMode}
            language={language}
            onLanguageChange={setLanguage}
            readOnly={readOnly}
            autoSave={autoSave}
            placeholder="Start writing your notebook..."
            // Phase 4: Remote cursor props
            remoteCursors={activeUsers.map(u => ({
              user: u,
              position: u.cursorPosition || null,
              selection: u.cursorSelection || null
            }))}
            currentUserId={currentUser?.id}
            notebookId={notebookData?._id || ''}
            socketClient={socketClient}
          />
        </Box>

        {/* Comments drawer */}
        <Drawer
          anchor="right"
          open={isCommentsPanelOpen}
          onClose={() => setIsCommentsPanelOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 400 },
              bgcolor: alpha(theme.palette.background.paper, 0.98),
            },
          }}
        >
          <CommentsPanel
            notebookId={notebookData?._id || ''}
            userRole={userRole}
            accessLevel={accessLevel}
            isGuest={false}
          />
        </Drawer>

        {/* Settings drawer */}
        <Drawer
          anchor="right"
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        >
          <SettingsDrawerContent
            onClose={() => setIsSettingsOpen(false)}
            onCollaborators={() => setIsCollaboratorsSettingsOpen(true)}
            onPassword={() => setIsPasswordSettingsOpen(true)}
            onPermissions={() => setIsPermissionsSettingsOpen(true)}
            onUrlSettings={() => setIsUrlSettingsOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
            userRole={userRole}
            editorMode={editorMode}
            onEditorModeChange={setEditorMode}
            language={language}
            onLanguageChange={setLanguage}
          />
        </Drawer>

        {/* Phase 5: Share dialog */}
        <ShareDialog
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          notebookId={notebookData?._id || ''}
          notebookTitle={title || 'Untitled'}
          urlIdentifier={urlIdentifier || ''}
          permissions={notebookData?.permissions || 'everyone'}
          isOwner={userRole === 'owner' || accessLevel === 'owner'}
          onOpenUrlSettings={() => setIsUrlSettingsOpen(true)}
          onUrlUpdated={(nextUrlIdentifier) => {
            setUrlIdentifier(nextUrlIdentifier);
            if (nextUrlIdentifier) {
              navigate(`/Notebook/${nextUrlIdentifier}`, { replace: true });
            }
          }}
        />

        <NotebookUrlSettingsDialog
          open={isUrlSettingsOpen}
          onClose={() => setIsUrlSettingsOpen(false)}
          notebookId={notebookData?._id || ''}
          currentUrlIdentifier={urlIdentifier || ''}
          isOwner={userRole === 'owner' || accessLevel === 'owner'}
          onUpdated={(nextUrlIdentifier) => {
            setUrlIdentifier(nextUrlIdentifier);
            if (nextUrlIdentifier) {
              navigate(`/Notebook/${nextUrlIdentifier}`, { replace: true });
            }
          }}
        />

        {/* Version History Dialog */}
        <VersionHistoryDialog
          open={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          notebookId={notebookData?._id || ''}
          isOwner={userRole === 'owner'}
          onVersionRestore={async () => {
            await fetchNotebookData();
            setIsVersionHistoryOpen(false);
            showNotification('Version restored', 'success');
          }}
          onCompareVersions={(oldId, newId) => {
            setCompareVersions({ oldId, newId });
            setIsVersionComparisonOpen(true);
            setIsVersionHistoryOpen(false);
          }}
        />

        <VersionComparisonDialog
          open={isVersionComparisonOpen}
          onClose={() => {
            setIsVersionComparisonOpen(false);
            setIsVersionHistoryOpen(true);
          }}
          notebookId={notebookData?._id || ''}
          oldVersionId={compareVersions.oldId}
          newVersionId={compareVersions.newId}
          onVersionRestore={async () => {
            await fetchNotebookData();
            setIsVersionComparisonOpen(false);
          }}
        />

        {/* Collaborators Dialog */}
        <CollaboratorsSettingsDialog
          open={isCollaboratorsSettingsOpen}
          onClose={() => setIsCollaboratorsSettingsOpen(false)}
          notebookId={notebookData?._id || ''}
          initialSettings={{ collaborators: notebookData?.collaborators || [] }}
          searchCollaborators={async (query) => {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.apiUrl}/api/users/search?q=${query}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            // API returns array directly, not wrapped in { users: [] }
            return Array.isArray(response.data) ? response.data : [];
          }}
          onSave={async (settings) => {
            const token = localStorage.getItem('token');
            await axios.put(`${config.apiUrl}/api/notebooks/${notebookData?._id}/collaborators`, settings, {
              headers: { Authorization: `Bearer ${token}` },
            });
            await fetchNotebookData();
          }}
        />

        {/* Password Dialog */}
        <PasswordSettingsDialog
          open={isPasswordSettingsOpen}
          onClose={() => setIsPasswordSettingsOpen(false)}
          notebookId={notebookData?._id || ''}
          hasPassword={!!notebookData?.hasPassword}
          onSave={async (settings) => {
            const token = localStorage.getItem('token');
            const response = await axios.put(
              `${config.apiUrl}/api/notebooks/${notebookData?._id}/password`,
              { password: settings.password || '' },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchNotebookData();
            return response.data;
          }}
        />

        {/* Permissions Dialog */}
        <PermissionsSettingsDialog
          open={isPermissionsSettingsOpen}
          onClose={() => setIsPermissionsSettingsOpen(false)}
          notebookId={notebookData?._id || ''}
          currentPermissions={notebookData?.permissions || 'everyone'}
          onSave={async (settings) => {
            const token = localStorage.getItem('token');
            await axios.put(
              `${config.apiUrl}/api/notebooks/${notebookData?._id}`,
              settings,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchNotebookData();
          }}
        />

        {/* Delete Dialog */}
        <DeleteNotebookDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          notebookTitle={title}
          isDeleting={isDeleting}
          onConfirm={async () => {
            try {
              setIsDeleting(true);
              const token = localStorage.getItem('token');
              await axios.delete(`${config.apiUrl}/api/notebooks/${notebookData?._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              showNotification('Notebook deleted', 'success');
              setTimeout(() => navigate('/notebooks'), 1000);
            } catch (error) {
              showNotification('Delete failed', 'error');
            } finally {
              setIsDeleting(false);
              setIsDeleteDialogOpen(false);
            }
          }}
        />

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog
          open={isKeyboardShortcutsOpen}
          onClose={() => setIsKeyboardShortcutsOpen(false)}
        />

        {/* Phase 6: Conflict Resolution placeholder */}
        <Portal>
          <Backdrop
            open={!!conflictData}
            sx={{ zIndex: 1400 }}
          >
            {conflictData && (
              <Paper sx={{ p: 4, maxWidth: 600, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom>Conflict Detected</Typography>
                <Typography color="text.secondary" paragraph>
                  Another user has modified this notebook. Choose how to resolve:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={() => setConflictData(null)}>
                    Keep My Changes
                  </Button>
                  <Button variant="outlined" onClick={() => setConflictData(null)}>
                    Use Server Version
                  </Button>
                </Box>
              </Paper>
            )}
          </Backdrop>
        </Portal>

        {/* Connection error */}
        <Portal>
          <Backdrop
            open={!!connectionError && !isConnected}
            sx={{ zIndex: 1400, flexDirection: 'column', gap: 2 }}
          >
            <CloudOffIcon sx={{ fontSize: 64 }} />
            <Typography variant="h6">Connection Lost</Typography>
            <Typography variant="body2">{connectionError}</Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reconnect
            </Button>
          </Backdrop>
        </Portal>

        {/* Notification snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
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
      </Box>
    </ErrorBoundary>
  );
};

export default EnhancedNotebookEditor;
