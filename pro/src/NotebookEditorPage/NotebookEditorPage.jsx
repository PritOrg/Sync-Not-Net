import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  Divider,
  Fade,
  CircularProgress,
  Backdrop
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
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import EnhancedEditor from '../Components/EnhancedEditor';
import SettingsDialog from './SettingsDialog';
import UnifiedAccessPrompt from './UnifiedAccessPrompt';
import PasswordSettingsDialog from './PasswordSettingsDialog';
import PermissionsSettingsDialog from './PermissionsSettingsDialog';
import CollaboratorsSettingsDialog from './CollaboratorsSettingsDialog';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import socketClient from '../utils/socketClient';
import UserPresence from '../Components/UserPresence';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const SAVE_THROTTLE = 5000;
const TYPING_DELAY = 100;

// Register a guest user for public collaboration
const registerGuest = async (guestName, urlId) => {
  if (!guestName || !urlId) throw new Error('Missing guest name or notebook identifier');
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${urlId}/register-guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestName })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to register guest');
  }
  return await response.json();
};

const NotebookEditor = () => {
  const { urlIdentifier: urlIdentifier_from_url } = useParams();
  const navigate = useNavigate();

  console.log('NotebookEditor component loaded with urlIdentifier:', urlIdentifier_from_url);

  // State
  const [urlIdentifier, setUrlIdentifier] = useState(urlIdentifier_from_url);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [editorMode, setEditorMode] = useState('quill');
  const [autoSave, setAutoSave] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccessPromptOpen, setIsAccessPromptOpen] = useState(false);
  const [isPasswordSettingsOpen, setIsPasswordSettingsOpen] = useState(false);
  const [isPermissionsSettingsOpen, setIsPermissionsSettingsOpen] = useState(false);
  const [isCollaboratorsSettingsOpen, setIsCollaboratorsSettingsOpen] = useState(false);
  const [notebookData, setNotebookData] = useState({});
  const [firstSaveDone, setFirstSaveDone] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [accessPromptData, setAccessPromptData] = useState({});
  const [guestInfo, setGuestInfo] = useState(null);
  const [isGuestRegistered, setIsGuestRegistered] = useState(false);
  const [userRole, setUserRole] = useState('viewer');

  // Real-time collaboration state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [lastSavedVersion, setLastSavedVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [accessLevel, setAccessLevel] = useState('read'); // 'read', 'write', 'owner'
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [requiresGuestName, setRequiresGuestName] = useState(false);

  // Refs for timers
  const saveTimer = useRef(null);
  const typingTimer = useRef(null);
  const lastSavedContent = useRef(content);

  // Function to generate a random URL identifier
  const generateRandomIdentifier = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  // Initialize socket connection and authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Only get user info and connect socket if authenticated
    if (token) {
      // Get current user info
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(userInfo);

      // Connect socket
      socketClient.connect(token);
    }

    // Setup event listeners
    const handleConnectionStatusChanged = (status) => {
      setIsConnected(status.connected);
      if (!status.connected) {
        setConnectionError(status.reason || 'Connection lost');
      } else {
        setConnectionError(null);
      }
    };

    const handleNotebookUpdated = (data) => {
      if (data.updatedBy.id !== currentUser?.id) {
        // Update from another user
        setContent(data.content);
        setTitle(data.title);
        setLastSavedVersion(data.version);
        showNotification('Notebook updated by ' + data.updatedBy.name);
      }
    };

    const handleUpdateConfirmed = (data) => {
      setLastSavedVersion(data.version);
      setIsSaving(false);
      setLastSavedTime(new Date());
      showNotification('Changes saved successfully');
    };

    const handleConflictDetected = (data) => {
      setConflictData(data);
      setIsSaving(false);
      showNotification('Conflict detected! Please resolve conflicts.');
    };

    const handleSocketError = (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Socket error occurred');
      showNotification('Connection error: ' + (error.message || 'Unknown error'));
    };

    // Register event listeners
    socketClient.on('connectionStatusChanged', handleConnectionStatusChanged);
    socketClient.on('notebookUpdated', handleNotebookUpdated);
    socketClient.on('updateConfirmed', handleUpdateConfirmed);
    socketClient.on('conflictDetected', handleConflictDetected);
    socketClient.on('socketError', handleSocketError);

    return () => {
      // Cleanup event listeners
      socketClient.off('connectionStatusChanged', handleConnectionStatusChanged);
      socketClient.off('notebookUpdated', handleNotebookUpdated);
      socketClient.off('updateConfirmed', handleUpdateConfirmed);
      socketClient.off('conflictDetected', handleConflictDetected);
      socketClient.off('socketError', handleSocketError);
    };
  }, [navigate, currentUser?.id]);

  // Join notebook room when notebook data is available
  useEffect(() => {
    if (notebookData._id && isConnected) {
      socketClient.joinNotebook(notebookData._id);
    }
  }, [notebookData._id, isConnected]);

  // Helper functions for saving
  const cleanDataForSave = useCallback((data) => {
    return {
      title: data.title,
      content: data.content,
      editorMode: data.editorMode,
      autoSave: data.autoSave,
      password: data.password,
      requiresPassword: data.requiresPassword,
      collaborators: data.collaborators,
      urlIdentifier: data.urlIdentifier,
    };
  }, []);

  // Save notebook function with improved error handling
  const saveNotebook = useCallback(async (id, data) => {
    if (!isConnected) {
      throw new Error('No connection to server. Please check your internet connection.');
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const response = await fetch(`${API_BASE_URL}/api/notebooks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save notebook');
      }

      const savedData = await response.json();
      setLastSavedVersion(savedData.notebook.version || 0);
      return savedData;
    } catch (error) {
      console.error('Save error:', error);
      throw error; // Re-throw to be handled by caller
    } finally {
      setIsSaving(false);
    }
  }, [isConnected]);

  // Auto-save function with improved error handling
  const autoSaveNotebook = useCallback(async () => {
    if (!firstSaveDone || !notebookData._id || !isConnected) return;

    try {
      const dirtyData = {
        title,
        content,
        editorMode,
        autoSave,
      };

      const cleanData = cleanDataForSave(dirtyData);
      await saveNotebook(notebookData._id, cleanData);
      lastSavedContent.current = content;
      setLastSavedTime(new Date());
      
      // Only show success notification if not in auto-save mode
      if (!autoSave) {
        showNotification('Changes saved successfully', 'success');
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification(error.message || 'Failed to save changes. Please check your connection.', 'error');
      
      // Update connection status if it's a connection error
      if (!isConnected || error.message.includes('connection')) {
        setConnectionError(error.message);
        setIsConnected(false);
      }
      
      throw error; // Re-throw for handling by the auto-save effect
    }
  }, [firstSaveDone, notebookData._id, title, content, editorMode, autoSave, cleanDataForSave, saveNotebook, isConnected]);

  // Auto-save effect with improved error handling and retry mechanism
  useEffect(() => {
    if (!autoSave || !firstSaveDone || !isConnected) return;

    let saveRetryCount = 0;
    const MAX_RETRIES = 3;
    
    const trySave = async () => {
      try {
        if (content !== lastSavedContent.current) {
          await autoSaveNotebook();
          saveRetryCount = 0; // Reset counter on successful save
        }
      } catch (error) {
        console.error('Auto-save attempt failed:', error);
        saveRetryCount++;
        
        if (saveRetryCount < MAX_RETRIES) {
          // Retry after exponential backoff
          setTimeout(trySave, Math.min(1000 * Math.pow(2, saveRetryCount), 10000));
        } else {
          showNotification('Auto-save failed after multiple attempts. Please check your connection.', 'error');
          setAutoSave(false); // Disable auto-save after max retries
        }
      }
    };

    const timeoutId = setTimeout(trySave, SAVE_THROTTLE);
    return () => clearTimeout(timeoutId);
  }, [title, content, autoSave, firstSaveDone, isConnected, lastSavedVersion, autoSaveNotebook]);

  // Helper: Initialize notebook state from data
  const initializeNotebook = (data, preserveLocalSettings = false) => {
    console.log('Initializing notebook with data:', data);
    setNotebookData(data);
    setTitle(data.title || '');
    setContent(data.content || '');
    setEditorMode(data.editorMode || 'quill');
    // Only update autoSave if we're not preserving local settings
    if (!preserveLocalSettings) {
      // Ensure we properly handle the autoSave boolean
      const autoSaveValue = data.autoSave !== undefined ? data.autoSave : false;
      console.log('Setting autoSave to:', autoSaveValue, 'from data.autoSave:', data.autoSave);
      setAutoSave(autoSaveValue);
    }
    setLastSavedTime(data.lastEdited ? new Date(data.lastEdited) : new Date());

    // Set accessLevel and userRole based on backend data
    if (data.accessLevel) setAccessLevel(data.accessLevel);
    else if (data.userRole === 'owner' || data.userRole === 'collaborator') setAccessLevel('write');
    else if (data.userRole === 'guest' && (data.permissions === 'everyone' || data.accessLevel === 'edit')) setAccessLevel('edit');
    else setAccessLevel('read');
    if (data.userRole) setUserRole(data.userRole);
  };

  // Enhanced fetchNotebookData with better error handling and access control
  const fetchNotebookData = useCallback(async () => {
    if (!urlIdentifier) {
      throw new Error('No notebook identifier provided');
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      } : {
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${urlIdentifier}`, {
        headers
      });

      const data = await response.json();
      console.log('Notebook data received:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notebook');
      }

      setNotebookData(data);
      

      // Handle guest name and password requirements in correct order
      if ((data.requiresGuestName && !isAuthenticated) || data.requiresPassword) {
        setRequiresGuestName(!!data.requiresGuestName && !isAuthenticated);
        setRequiresPassword(!!data.requiresPassword);
        setIsAccessPromptOpen(true);
        setAccessPromptData(data);
        return;
      }

      // Initialize notebook if we have access
      if (data.hasAccess || data.content) {
        console.log('Initializing notebook with full access');
        initializeNotebook(data);
      } else {
        throw new Error('No access to notebook content');
      }
    } catch (error) {
      console.error('Error fetching notebook:', error);
      setConnectionError(error.message);
      setSnackbarMessage(error.message || 'Error loading notebook');
      setSnackbarOpen(true);

      // Handle specific error cases
      if (error.message.includes('No access') || error.message.includes('password')) {
        setRequiresPassword(true);
        setIsAccessPromptOpen(true);
      }
    }
  }, [urlIdentifier, isAuthenticated]);


  // Load notebook on initial render
  useEffect(() => {
    const loadNotebook = async () => {
      // Handle new notebook creation
      if (urlIdentifier_from_url.toString() === 'new') {
        const token = localStorage.getItem('token');
        if (!token) {
          // navigate('/auth?mode=login');
          return;
        }
        
        const newIdentifier = generateRandomIdentifier();
        setUrlIdentifier(newIdentifier);
        navigate(`/Notebook/${newIdentifier}`, { replace: true });

        // Initialize empty notebook for new creation
        initializeNotebook({
          _id: null,
          title: 'Untitled Notebook',
          content: '',
          editorMode: 'quill',
          autoSave: false,
          urlIdentifier: newIdentifier,
          requiresPassword: false,
          collaborators: []
        });
        return;
      }

      // Load existing notebook
      if (urlIdentifier_from_url && urlIdentifier_from_url !== 'new') {
        console.log('Loading notebook with identifier:', urlIdentifier_from_url);
        const data = await fetchNotebookData(urlIdentifier_from_url);

        if (data) {
          console.log('Notebook data received:', data);
          
          // Check if password is required even for authenticated access
          if (data.requiresPassword && !data.hasAccess) {
            console.log('Password required - showing access prompt');
            setAccessPromptData(data);
            setIsAccessPromptOpen(true);
          } else if (data.requiresGuestName) {
            console.log('Guest name required - prompt should already be shown');
            // Guest name prompt is already handled in fetchNotebookData
          } else {
            console.log('Initializing notebook...');
            initializeNotebook(data);
          }
        } else {
          // fetchNotebookData handles prompts internally, so if no data is returned,
          // it means either a prompt was shown or there was an error
          console.log('No notebook data returned - prompt should be shown or error occurred');
        }
      }
    };

    loadNotebook();
  }, [urlIdentifier_from_url, fetchNotebookData]);

  // Helper functions
  const showNotification = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };









  const handleSave = async (settingsData = {}, isManualSave = true) => {
    if (!firstSaveDone) {
      setIsSettingsOpen(true);
      return;
    }

    // For manual saves, show confirmation dialog
    if (isManualSave) {
      Swal.fire({
        title: 'Save Notebook?',
        text: "Do you want to save the changes?",
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Save',
      }).then(async (result) => {
        if (result.isConfirmed) {
          const dirtyData = {
            title,
            content,
            editorMode,
            autoSave,
            ...settingsData,
          };

          const cleanData = cleanDataForSave(dirtyData);

          try {
            await saveNotebook(notebookData._id, cleanData);
            setFirstSaveDone(true);
            showNotification('Your notebook has been saved');
            Swal.fire('Saved!', 'Your notebook has been saved.', 'success');
          } catch (error) {
            Swal.fire('Error!', error.message, 'error');
          }
        }
      });
    } else {
      // For auto-saves, save silently without dialog
      const dirtyData = {
        title,
        content,
        editorMode,
        autoSave,
        ...settingsData,
      };

      const cleanData = cleanDataForSave(dirtyData);

      try {
        await saveNotebook(notebookData._id, cleanData);
        setFirstSaveDone(true);
        showNotification('Changes auto-saved');
      } catch (error) {
        console.error('Auto-save error:', error);
        showNotification('Auto-save failed', 'error');
      }
    }
  };

  const handleEditorSwitch = () => {
    Swal.fire({
      title: 'Switch Editor Type?',
      text: "Switching editor may affect formatting. Continue?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, switch',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setEditorMode(prev => (prev === 'quill' ? 'monaco' : 'quill'));
      }
    });
  };

  // Enhanced content change handlers with typing indicators
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);

    // Send typing indicator
    if (isConnected && notebookData._id) {
      socketClient.startTyping(notebookData._id);

      // Clear existing typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to stop typing indicator
      const newTimeout = setTimeout(() => {
        socketClient.stopTyping(notebookData._id);
      }, 2000);

      setTypingTimeout(newTimeout);
    }
  }, [isConnected, notebookData._id, typingTimeout]);

  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);

    // Send typing indicator for title changes too
    if (isConnected && notebookData._id) {
      socketClient.startTyping(notebookData._id);

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      const newTimeout = setTimeout(() => {
        socketClient.stopTyping(notebookData._id);
      }, 2000);

      setTypingTimeout(newTimeout);
    }
  }, [isConnected, notebookData._id, typingTimeout]);

  const searchCollaborators = async (query) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?query=${query}`, {
        headers: { "Authorization": token },
      });

      if (!response.ok) {
        throw new Error('Error fetching collaborators.');
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      Swal.fire('Error!', error.message, 'error');
      return [];
    }
  };

  const saveURL = async (notebookId, newURL) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/url`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": token
        },
        body: JSON.stringify({ urlIdentifier: newURL }),
      });

      if (!response.ok) {
        throw new Error('Error saving URL.');
      }

      showNotification('Custom URL updated successfully');
    } catch (error) {
      Swal.fire('Error!', error.message, 'error');
    }
  };



  const formatTimestamp = (date) => {
    if (!date) return 'Not saved yet';

    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;

    return date.toLocaleString();
  };

  // Use the enhanced fetchNotebookData function defined above

  // Handle password verification success
  const handlePasswordSuccess = async (data, { guestName } = {}) => {
    console.log('Password verified successfully', { data, guestName });
    setRequiresPassword(false);
    setIsAccessPromptOpen(false);

    if (guestName && !isAuthenticated) {
      try {
        const guestData = await registerGuest(guestName, urlIdentifier);
        setGuestInfo(guestData.guestUser);
        setIsGuestRegistered(true);
        initializeNotebook(guestData);
      } catch (error) {
        console.error('Error registering guest:', error);
        setSnackbarMessage(error.message || 'Error registering as guest');
        setSnackbarOpen(true);
      }
    } else {
      initializeNotebook(data);
    }
  };

  // Handle unified access prompt submission
  const handleAccessPromptSubmit = async ({ guestName, password }) => {
    try {
      // If both guestName and password are required, or just one
      if (guestName && !password) {
        // Register guest, may require password next
        const guestData = await registerGuest(guestName, urlIdentifier);
        setGuestInfo(guestData.guestUser);
        setIsGuestRegistered(true);
        if (guestData.requiresPassword) {
          setAccessPromptData({ ...guestData, guestName, requiresGuestName: false, requiresPassword: true });
          setRequiresPassword(true);
          setRequiresGuestName(false);
          // Stay in prompt, now only ask for password
        } else {
          setIsAccessPromptOpen(false);
          initializeNotebook(guestData);
        }
      } else if (password) {
        // Verify password (and guestName if present)
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const body = { password };
        if (guestName) body.guestName = guestName;
        let guestId;
        try {
          const guestInfo = JSON.parse(localStorage.getItem('guestInfo'));
          if (guestInfo && guestInfo.id) guestId = guestInfo.id;
        } catch {}
        if (guestId) body.guestId = guestId;
        const response = await fetch(`${API_BASE_URL}/api/notebooks/${urlIdentifier}/verify-password`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Incorrect password. Please try again.');
        }
        const data = await response.json();
        if (data.guestUser) {
          localStorage.setItem('guestInfo', JSON.stringify(data.guestUser));
        }
        setIsAccessPromptOpen(false);
        initializeNotebook(data);
      }
    } catch (error) {
      console.error('Access prompt error:', error);
      setSnackbarMessage(error.message || 'Access denied');
      setSnackbarOpen(true);
    }
  };

  // UI Rendering
  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      bgcolor: '#f7f9fc'
    }}>

      {/* Unified Access Prompt */}
      {isAccessPromptOpen && (
        <UnifiedAccessPrompt
          open={isAccessPromptOpen}
          onClose={() => setIsAccessPromptOpen(false)}
          onSubmit={handleAccessPromptSubmit}
          notebookTitle={accessPromptData.notebook?.title || title || 'Untitled Notebook'}
          creatorName={accessPromptData.notebook?.creator?.name || 'Unknown'}
          requiresGuestName={requiresGuestName}
          requiresPassword={requiresPassword}
          isLoading={false}
          error={null}
          initialStep={requiresGuestName ? 'guestName' : 'password'}
        />
      )}

      {/* Main Editor Area */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Paper
          elevation={2}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: { xs: 0, sm: 2 },
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              padding: { xs: 2, sm: 3 },
              borderBottom: '1px solid rgba(0,0,0,0.09)',
              background: 'linear-gradient(to right, #ffffff, #f5f8ff)',
            }}
          >
            <TextField
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              variant="standard"
              placeholder="Untitled Notebook"
              fullWidth
              InputProps={{
                sx: {
                  fontSize: { xs: '1.4rem', sm: '1.7rem' },
                  fontWeight: 600,
                  fontFamily: '"Inter", -apple-system, sans-serif',
                  '&::before': { display: 'none' },
                  '&::after': { display: 'none' },
                }
              }}
            />

            {/* Status indicators */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mt: 1,
              flexWrap: 'wrap'
            }}>
              {/* Connection status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isConnected ? (
                  <CloudSyncIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                ) : (
                  <CloudOffIcon sx={{ fontSize: '0.9rem', color: 'error.main' }} />
                )}
                <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
                  {isConnected ? 'Connected' : 'Offline'}
                </Typography>
              </Box>

              {/* Saving status */}
              {isSaving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircularProgress size={12} />
                  <Typography variant="caption" color="primary">
                    Saving...
                  </Typography>
                </Box>
              )}

              {/* Last saved time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <ClockIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                <Typography variant="caption">
                  {lastSavedTime ? `Last saved: ${formatTimestamp(lastSavedTime)}` : 'Not saved yet'}
                </Typography>
              </Box>

              {/* Conflict warning */}
              {conflictData && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WarningIcon sx={{ fontSize: '0.9rem', color: 'warning.main' }} />
                  <Typography variant="caption" color="warning.main">
                    Conflict detected
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2, opacity: 0.6 }} />

            {/* Read-only Access Banner */}
            {accessLevel === 'read' && (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
                You are viewing this notebook in read-only mode.
                {!localStorage.getItem('token') && ' Sign in to request edit access.'}
              </Alert>
            )}

          
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              justifyContent: 'space-between'
            }}>
              {/* Left controls */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Tooltip title="Back to Notebooks">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/notebooks')}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'rgba(0,0,0,0.15)',
                      px: 2,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      }
                    }}
                  >
                    Back
                  </Button>
                </Tooltip>

                <Tooltip title={`Switch to ${editorMode === 'quill' ? 'Code' : 'Rich Text'} Editor`}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleEditorSwitch}
                    disabled={accessLevel === 'read'}
                    startIcon={editorMode === 'quill' ? <CodeIcon /> : <EditIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'rgba(0,0,0,0.15)',
                      px: 2,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      }
                    }}
                  >
                    {editorMode === 'quill' ? 'Code Editor' : 'Rich Text'}
                  </Button>
                </Tooltip>

                {accessLevel !== 'read' && (
                  <Tooltip title={autoSave ? 'Disable Autosave' : 'Enable Autosave'}>
                    <Button
                      size="small"
                      variant={autoSave ? 'contained' : 'outlined'}
                      onClick={async () => {
                        const newAutoSave = !autoSave;
                        setAutoSave(newAutoSave);
                        
                        // Save the autosave setting immediately if notebook exists
                        if (firstSaveDone && notebookData._id) {
                          try {
                            const dirtyData = {
                              title,
                              content,
                              editorMode,
                              autoSave: newAutoSave,
                            };
                            const cleanData = cleanDataForSave(dirtyData);
                            await saveNotebook(notebookData._id, cleanData);
                            showNotification(`Autosave ${newAutoSave ? 'enabled' : 'disabled'}`);
                          } catch (error) {
                            console.error('Failed to save autosave setting:', error);
                            setAutoSave(!newAutoSave); // Revert on error
                            showNotification('Failed to save autosave setting');
                          }
                        }
                      }}
                      startIcon={<AutoSaveIcon />}
                      color={autoSave ? 'success' : 'primary'}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: autoSave ? 'success.dark' : 'rgba(25, 118, 210, 0.04)',
                        }
                      }}
                    >
                      Autosave
                    </Button>
                  </Tooltip>
                )}
              </Box>

              {/* Status chip - This needs to be inside the same parent Box */}
              {autoSave && (
                <Chip
                  label="Auto-saving enabled"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ display: { xs: 'none', md: 'flex' } }}
                />
              )}
            </Box>
          </Box>

          {/* Enhanced Editor Section */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              p: 2,
            }}
          >
            <EnhancedEditor
              content={content}
              onChange={handleContentChange}
              onSave={handleSave}
              editorMode={editorMode === 'quill' ? 'rich' : 'code'}
              language="javascript"
              autoSave={autoSave}
              placeholder="Start writing your notebook..."
              readOnly={accessLevel === 'read'}
            />
          </Box>

          {/* Footer Actions */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: '1px solid rgba(0,0,0,0.09)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(to right, #ffffff, #f5f8ff)',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{
              display: { xs: 'none', sm: 'block' }
            }}>
              {autoSave ? 'Changes auto-saved to the cloud' : 'Remember to save your changes'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setIsSettingsOpen(true)}
                startIcon={<SettingsIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: 'rgba(0,0,0,0.15)',
                }}
              >
                Settings
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                disabled={autoSave && content === lastSavedContent.current}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  background: 'linear-gradient(45deg, #2196f3, #1976d2)',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  }
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Dialogs */}
      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notebookData={notebookData}
        saveURL={saveURL}
        onSave={handleSave}
        urlIdentifier={urlIdentifier}
        searchCollaborators={searchCollaborators}
        onOpenPasswordDialog={() => setIsPasswordSettingsOpen(true)}
        onOpenPermissionsDialog={() => setIsPermissionsSettingsOpen(true)}
        onOpenCollaboratorsDialog={() => setIsCollaboratorsSettingsOpen(true)}
        disabled={userRole !== 'owner' && accessLevel !== 'owner'}
      />

      {/* Remove legacy PasswordPrompt and GuestNamePrompt dialogs */}

      {isPasswordSettingsOpen && (
        <PasswordSettingsDialog
          open={isPasswordSettingsOpen}
          onClose={() => setIsPasswordSettingsOpen(false)}
          notebookId={notebookData._id}
          initialSettings={{ 
            password: notebookData.password,
            requiresPassword: !!notebookData.password 
          }}
          onSave={async (passwordSettings) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/password`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordSettings)
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
              }
              
              const responseData = await response.json();
              console.log('Password update response:', responseData);
              
              // Update local notebook data
              setNotebookData(prev => ({
                ...prev,
                password: passwordSettings.requiresPassword ? passwordSettings.password : null,
                requiresPassword: !!passwordSettings.requiresPassword
              }));
              
              setIsPasswordSettingsOpen(false);
              showNotification('Password settings updated successfully!');
              return responseData;
            } catch (error) {
              console.error('Failed to update password settings:', error);
              showNotification(`Failed to update password settings: ${error.message}`);
              throw error;
            }
          }}
        />
      )}

      {isPermissionsSettingsOpen && (
        <PermissionsSettingsDialog
          open={isPermissionsSettingsOpen}
          onClose={() => setIsPermissionsSettingsOpen(false)}
          notebookId={notebookData._id}
          initialSettings={{ 
            permissions: notebookData.permissions || 'everyone'
          }}
          onSave={async (permissionsSettings) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/permissions`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(permissionsSettings)
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
              }
              
              const responseData = await response.json();
              console.log('Permissions update response:', responseData);
              
              // Update local notebook data
              setNotebookData(prev => ({
                ...prev,
                permissions: permissionsSettings.permissions
              }));
              
              setIsPermissionsSettingsOpen(false);
              showNotification('Permission settings updated successfully!');
              return responseData;
            } catch (error) {
              console.error('Failed to update permission settings:', error);
              showNotification(`Failed to update permission settings: ${error.message}`);
              throw error;
            }
          }}
        />
      )}

      {isCollaboratorsSettingsOpen && (
        <CollaboratorsSettingsDialog
          open={isCollaboratorsSettingsOpen}
          onClose={() => setIsCollaboratorsSettingsOpen(false)}
          notebookId={notebookData._id}
          initialSettings={{ 
            collaborators: notebookData.collaborators || []
          }}
          searchCollaborators={searchCollaborators}
          onSave={async (collaboratorsSettings) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}/collaborators`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(collaboratorsSettings)
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
              }
              
              const responseData = await response.json();
              console.log('Collaborators update response:', responseData);
              
              // Update local notebook data
              setNotebookData(prev => ({
                ...prev,
                collaborators: responseData.collaborators || collaboratorsSettings.collaborators
              }));
              
              setIsCollaboratorsSettingsOpen(false);
              showNotification('Collaborator settings updated successfully!');
              return responseData;
            } catch (error) {
              console.error('Failed to update collaborator settings:', error);
              showNotification(`Failed to update collaborator settings: ${error.message}`);
              throw error;
            }
          }}
        />
      )}

      {/* User Presence Sidebar */}
      {notebookData._id && (
        <Fade in={isConnected}>
          <Box sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            display: { xs: 'none', lg: 'block' }
          }}>
            <UserPresence
              notebookId={notebookData._id}
              currentUser={currentUser}
            />
          </Box>
        </Fade>
      )}

      {/* Connection Error Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={!!connectionError && !isConnected}
      >
        <CloudOffIcon sx={{ fontSize: 48 }} />
        <Typography variant="h6">Connection Lost</Typography>
        <Typography variant="body2" textAlign="center">
          {connectionError}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Reconnect
        </Button>
      </Backdrop>

      {/* Conflict Resolution Dialog */}
      {conflictData && (
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 2,
            flexDirection: 'column',
            gap: 2,
            p: 4
          }}
          open={!!conflictData}
        >
          <Paper sx={{ p: 4, maxWidth: 600, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Conflict Detected
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Another user has made changes to this notebook. Please choose how to resolve the conflict:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => {
                  setContent(conflictData.serverContent);
                  setTitle(conflictData.serverTitle);
                  setLastSavedVersion(conflictData.serverVersion);
                  setConflictData(null);
                }}
              >
                Use Server Version
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  // Keep local changes and force save
                  setConflictData(null);
                  const updateData = {
                    notebookId: notebookData._id,
                    content,
                    title,
                    version: conflictData.serverVersion
                  };
                  socketClient.updateNotebook(updateData);
                }}
              >
                Keep My Changes
              </Button>
            </Box>
          </Paper>
        </Backdrop>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotebookEditor;