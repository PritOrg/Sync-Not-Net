import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useBeforeUnload } from 'react-router-dom';
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
  LinearProgress,
  Backdrop,
  useTheme,
  Portal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Drawer,
  IconButton
} from '@mui/material';
import KeyboardShortcutsDialog from '../Components/KeyboardShortcutsDialog';
import ErrorBoundary, { withErrorBoundary, InlineErrorFallback } from '../Components/ErrorBoundary';
import {
  EditorSkeleton,
  LoadingOverlay,
  PulseLoader
} from '../Components/LoadingStates';
import EnhancedUserPresence from '../Components/EnhancedUserPresence';
import DeleteNotebookDialog from '../Components/DeleteNotebookDialog';
import VersionHistoryDialog from './VersionHistoryDialog';
import VersionComparisonDialog from './VersionComparisonDialog';
import CommentsPanel from './CommentsPanel';
import { usePresence } from '../contexts/PresenceContext';

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
  Lock,
  Comment as CommentIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import EnhancedEditor from '../Components/EnhancedEditor';
import { fadeIn, getAnimationStyles } from '../utils/animations';
import { KeyboardShortcuts, isKeyboardShortcut } from '../utils/keyboardShortcuts';
import AutoSaveIndicator from '../Components/AutoSaveIndicator';
import SettingsDialog from './SettingsDialog';
import UnifiedAccessPrompt from './UnifiedAccessPrompt';
import AccessPrompt from './AccessPrompt';
import PasswordSettingsDialog from './PasswordSettingsDialog';
import PermissionsSettingsDialog from './PermissionsSettingsDialog';
import CollaboratorsSettingsDialog from './CollaboratorsSettingsDialog';
import Swal from 'sweetalert2';
import socketClient from '../utils/socketClient';
import { processContentFromBackend, prepareContentForBackend } from '../utils/contentUtils';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const SAVE_THROTTLE = 5000;
const TYPING_DELAY = 100;

const NotebookEditor = ({ mode = 'view' }) => {
  // Register guest user helper function
  const registerGuest = useCallback(async (guestName, urlId) => {
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
  }, []);
  // Router and theme hooks
  const { urlIdentifier: urlIdentifier_from_url } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // Function to show notifications
  const showNotification = useCallback((message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Helper function to generate random URL identifier
  const generateRandomIdentifier = useCallback(() => {
    return Math.random().toString(36).substring(2, 10);
  }, []);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [editorInitializing, setEditorInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading notebook...');

  // Content and editor state
  const [urlIdentifier, setUrlIdentifier] = useState(urlIdentifier_from_url);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorMode, setEditorMode] = useState('quill');
  const [language, setLanguage] = useState('javascript');
  const [notebookData, setNotebookData] = useState({});

  // UI state
  const [autoSave, setAutoSave] = useState(false);
  const [firstSaveDone, setFirstSaveDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccessPromptOpen, setIsAccessPromptOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isPasswordSettingsOpen, setIsPasswordSettingsOpen] = useState(false);
  const [isPermissionsSettingsOpen, setIsPermissionsSettingsOpen] = useState(false);
  const [isCollaboratorsSettingsOpen, setIsCollaboratorsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Version control states
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isVersionComparisonOpen, setIsVersionComparisonOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ oldId: null, newId: null });
  
  // Comments panel state
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);

  // Notification state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Access control state
  const [accessPromptData, setAccessPromptData] = useState({});
  const [guestInfo, setGuestInfo] = useState(null);
  const [isGuestRegistered, setIsGuestRegistered] = useState(() => {
    // Check if we have a guest name saved in localStorage
    const savedGuestName = localStorage.getItem('guestName');
    return !!savedGuestName; // Convert to boolean
  });
  const [userRole, setUserRole] = useState('viewer');
  const [accessLevel, setAccessLevel] = useState('read'); // 'read', 'write', 'owner'
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [requiresGuestName, setRequiresGuestName] = useState(false);
  const [accessError, setAccessError] = useState({
    isError: false,
    message: '',
    isAccessError: false
  });

  // Real-time collaboration state
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [lastSavedVersion, setLastSavedVersion] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Refs for timers and content tracking
  const saveTimer = useRef(null);
  const typingTimer = useRef(null);
  const lastSavedContent = useRef(content);

  // Register warning for unsaved changes
  useBeforeUnload(
    useCallback((event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        return event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    }, [hasUnsavedChanges])
  );

  // Function to generate a random URL identifier
  // Helper function to clean data before saving
  const cleanDataForSave = useCallback((data) => {
    // Only allow owner to send restricted fields
    const restrictedFields = ['permissions', 'collaborators', 'password', 'urlIdentifier', 'creatorID', 'version', 'createdAt', 'updatedAt'];
    const allowedFields = ['title', 'content', 'editorMode', 'autoSave', 'tags'];
    let result = {};
    if (userRole === 'owner' || accessLevel === 'owner') {
      // Owner: send everything present in data
      result = { ...data };
    } else {
      // Non-owner: only send allowed fields
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          result[field] = data[field];
        }
      });
    }
    return result;
  }, [userRole, accessLevel]);

  // Save notebook function with improved error handling
  const saveNotebook = useCallback(async (id, data) => {
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
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

 

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
    } else {
      // No token, redirect to login
      navigate('/auth?mode=login');
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
      // Defensive: ensure data and updatedBy are defined and have id
      if (!data || !data.updatedBy || typeof data.updatedBy.id === 'undefined') {
        // Fallback: just update if not from this user (or if cannot determine)
        if (!currentUser || !currentUser.id || !data.updatedBy || data.updatedBy?.id !== currentUser.id) {
          if (typeof data.content !== 'undefined') {
            const processedContent = processContentFromBackend(data.content);
            setContent(processedContent);
          }
          if (typeof data.title !== 'undefined') setTitle(data.title);
          if (typeof data.version !== 'undefined') setLastSavedVersion(data.version);
          showNotification('Notebook updated');
        }
        return;
      } if (data.updatedBy.id !== currentUser?.id) {
        // Update from another user
        if (typeof data.content !== 'undefined') {
          const processedContent = processContentFromBackend(data.content);
          setContent(processedContent);
        }
        if (typeof data.title !== 'undefined') setTitle(data.title);
        if (typeof data.version !== 'undefined') setLastSavedVersion(data.version);
        showNotification('Notebook updated by ' + (data.updatedBy.name || 'another user'), 'info');
      }
    };

    const handleUpdateConfirmed = (data) => {
      setLastSavedVersion(data.version);
      setIsSaving(false);
      setLastSavedTime(new Date());
      showNotification('Changes saved successfully', 'success');
    };

    const handleConflictDetected = (data) => {
      setConflictData(data);
      setIsSaving(false);
      showNotification('Conflict detected! Please resolve conflicts.', 'warning');
    };

    const handleSocketError = (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Socket error occurred');
      showNotification('Connection error: ' + (error.message || 'Unknown error'), 'error');
    };
    
    const handleConnectionError = (data) => {
      console.error('Connection error:', data);
      if (data.error && data.error.message) {
        // Check for access restriction errors
        const errorMsg = data.error.message.toLowerCase();
        if (errorMsg.includes('only accessible by collaborators') || 
            errorMsg.includes('access denied') || 
            errorMsg.includes('not authorized') ||
            errorMsg.includes('permission denied')) {
          setAccessError({
            isError: true,
            message: data.error.message,
            isAccessError: true
          });
          setIsLoading(false);
        } else {
          setConnectionError(data.error.message);
        }
      }
    };

    const handleJoinedNotebook = (data) => {
      console.log('Joined notebook room:', data);
      if (data.currentUsers) {
        setActiveUsers(data.currentUsers);
      }
    };

    const handleUserJoined = (data) => {
      console.log('User joined:', data);
      if (data.user) {
        setActiveUsers(prev => [...prev, data.user]);
        showNotification(`${data.user.name} joined the notebook`, 'info');
      }
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data);
      if (data.user) {
        setActiveUsers(prev => prev.filter(u => u.id !== data.user.id));
        showNotification(`${data.user.name} left the notebook`, 'info');
      }
    };

    // Register event listeners
    socketClient.on('connectionStatusChanged', handleConnectionStatusChanged);
    socketClient.on('notebookUpdated', handleNotebookUpdated);
    socketClient.on('updateConfirmed', handleUpdateConfirmed);
    socketClient.on('conflictDetected', handleConflictDetected);
    socketClient.on('socketError', handleSocketError);
    socketClient.on('connectionError', handleConnectionError);
    socketClient.on('joinedNotebook', handleJoinedNotebook);
    socketClient.on('userJoined', handleUserJoined);
    socketClient.on('userLeft', handleUserLeft);

    return () => {
      // Cleanup event listeners
      socketClient.off('connectionStatusChanged', handleConnectionStatusChanged);
      socketClient.off('notebookUpdated', handleNotebookUpdated);
      socketClient.off('updateConfirmed', handleUpdateConfirmed);
      socketClient.off('conflictDetected', handleConflictDetected);
      socketClient.off('socketError', handleSocketError);
      socketClient.off('connectionError', handleConnectionError);
      socketClient.off('joinedNotebook', handleJoinedNotebook);
      socketClient.off('userJoined', handleUserJoined);
      socketClient.off('userLeft', handleUserLeft);
    };
  }, [navigate, currentUser, showNotification, socketClient]);

  // Join notebook room when notebook data is available
  useEffect(() => {
    if (notebookData._id && isConnected) {
      socketClient.joinNotebook(notebookData._id);
    }
  }, [notebookData._id, isConnected]);

  // Auto-save effect with improved error handling and retry mechanism

  // Auto-save function with improved error handling
  const autoSaveNotebook = useCallback(async () => {
    if (!firstSaveDone || !notebookData._id || !isConnected) return;

    try {
      const dirtyData = {
        title,
        content: prepareContentForBackend(content),
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
  }, [firstSaveDone, notebookData._id, title, content, editorMode, autoSave, cleanDataForSave, saveNotebook, isConnected, showNotification, prepareContentForBackend, lastSavedContent]);

  // Auto-save effect with improved error handling and retry mechanism
  useEffect(() => {
    let timeoutId;
    
    if (!autoSave || !firstSaveDone || !isConnected) {
      return;
    }

    let saveRetryCount = 0;
    const MAX_RETRIES = 3;

    const trySave = async () => {
      // Prevent saving if content hasn't changed
      if (content === lastSavedContent.current) {
        return;
      }

      try {
        await autoSaveNotebook();
        saveRetryCount = 0; // Reset counter on successful save
      } catch (error) {
        console.error('Auto-save attempt failed:', error);
        saveRetryCount++;

        if (saveRetryCount < MAX_RETRIES) {
          // Retry after exponential backoff
          timeoutId = setTimeout(trySave, Math.min(1000 * Math.pow(2, saveRetryCount), 10000));
        } else {
          showNotification('Auto-save failed after multiple attempts. Please check your connection.', 'error');
          setAutoSave(false); // Disable auto-save after max retries
        }
      }
    };

    // Initial save attempt
    timeoutId = setTimeout(trySave, SAVE_THROTTLE);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    autoSave,
    firstSaveDone,
    isConnected,
    content,
    lastSavedContent,
    autoSaveNotebook,
    showNotification,
    setAutoSave,
    SAVE_THROTTLE
  ]);

  // Helper: Initialize notebook state from data
  const initializeNotebook = useCallback(async (data, preserveLocalSettings = false) => {
    // Initialize notebook with the provided data
    setLoadingMessage('Initializing editor...');
    setEditorInitializing(true);

    // Add animation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    // Set notebook data
    setNotebookData(data);
    
    // Check if notebook still requires access prompt
    const needsGuestName = !!data.requiresGuestName && !isAuthenticated && !isGuestRegistered;
    const needsPassword = !!data.requiresPassword && !data.hasAccess;
    
    if (needsGuestName || data.requiresPassword) {
      // Check access requirements during initialization
      
      // Update state for access requirements
      setRequiresGuestName(needsGuestName);
      setRequiresPassword(needsPassword);
      
      // Check if we need to show the access prompt
      if (needsGuestName || needsPassword) {
        setIsAccessPromptOpen(true);
        setAccessPromptData(data);
        return; // Don't proceed with initialization yet
      }
    }
    
    setTitle(data.title || '');

    // Process content from backend (extract from XML if needed)
    const processedContent = processContentFromBackend(data.content || '');
    setContent(processedContent);

    setEditorMode(data.editorMode || 'quill');
    setLanguage(data.language || 'javascript');
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

    // Join notebook room for collaboration if socket is connected
    if (socketClient.socket && socketClient.isConnected && data._id) {
      console.log('Joining notebook room:', data._id);
      socketClient.socket.emit('joinNotebook', data._id);
    }

    // Editor is now initialized
    setEditorInitializing(false);
  }, [setContent, setTitle, setHasUnsavedChanges, setLoadingMessage, setEditorInitializing, setEditorMode, setLanguage, setNotebookData, setLastSavedVersion, isAuthenticated, isGuestRegistered, socketClient, processContentFromBackend]);

  // Enhanced fetchNotebookData with better error handling and access control
  const fetchNotebookData = useCallback(async () => {
    if (!urlIdentifier || urlIdentifier === 'new' || urlIdentifier === 'create') {
      throw new Error('No valid notebook identifier provided');
    }

    // Reset states before fetching
    setIsLoading(true);
    setLoadingMessage('Loading notebook...');
    setAccessError({
      isError: false,
      message: '',
      isAccessError: false
    });

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

      // We'll set notebookData only when we know what path to take

      // Handle guest name and password requirements in clear order
      const needsGuestName = data.requiresGuestName && !isAuthenticated && !isGuestRegistered;
      const needsPassword = !!data.requiresPassword;
      
      if (needsGuestName || needsPassword) {
        console.log('Access restrictions detected:', { 
          requiresGuestName: data.requiresGuestName, 
          requiresPassword: data.requiresPassword,
          isAuthenticated,
          needsGuestName,
          needsPassword
        });
        
        // Store notebook data and access requirements
        setNotebookData(data);
        setRequiresGuestName(needsGuestName);
        setRequiresPassword(needsPassword);
        setAccessPromptData(data);
        
        // Show password prompt
        // Opening access prompt with appropriate settings
        setIsAccessPromptOpen(true);
        setIsLoading(false); // Stop loading when showing access prompt
        setEditorInitializing(false); // Make sure to disable editor initializing state as well
        
        return;
      }

      // Initialize notebook if we have access
      if (data.hasAccess || data.content) {
        console.log('Initializing notebook with full access');
        await initializeNotebook(data);
        setIsLoading(false);
      } else {
        console.log('No notebook data returned - prompt should be shown or error occurred');
        throw new Error('No access to notebook content');
      }
    } catch (error) {
      console.error('Error fetching notebook:', error);
      setConnectionError(error.message);
      setSnackbarMessage(error.message || 'Error loading notebook');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsLoading(false);
      setEditorInitializing(false); // Also set this to false to prevent skeleton loader

      // Track access-related errors to show appropriate UI
      const isAccessError = 
        error.message.includes('access') || 
        error.message.includes('Access denied') || 
        error.message.includes('only accessible by') ||
        error.message.includes('collaborators');
        
      // Handle specific error cases
      if (error.message.includes('No access') || error.message.includes('password')) {
        setRequiresPassword(true);
        setIsAccessPromptOpen(true);
      }
      
      // Set access error state for UI handling
      setAccessError({
        isError: true,
        message: error.message,
        isAccessError: isAccessError
      });
    }
  }, [urlIdentifier, isAuthenticated]);


  // Warn about unsaved changes before leaving
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [hasUnsavedChanges]
    )
  );

  // Check for saved guest name on mount
  useEffect(() => {
    const savedGuestName = localStorage.getItem('guestName');
    if (savedGuestName && !isAuthenticated) {
      console.log('Found saved guest name:', savedGuestName);
      setIsGuestRegistered(true);
      setGuestInfo({ guestName: savedGuestName });
    }
  }, [isAuthenticated]);

  // Load notebook on initial render
  useEffect(() => {
    const loadNotebook = async () => {
      try {
        // Handle new notebook creation mode
        if (mode === 'new') {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/auth?mode=login');
            return;
          }

          // Initialize empty editor without creating notebook
          setLoadingMessage('Initializing new notebook...');
          setContent('');
          setTitle('Untitled Notebook');
          setEditorMode(urlIdentifier === 'create' ? 'monaco' : 'quill');
          setLanguage(urlIdentifier === 'create' ? 'javascript' : undefined);
          setAutoSave(false);
          setAccessLevel('edit'); // Set edit access for new notebook
          setUserRole('owner'); // Set as owner for new notebook
          setIsLoading(false);
          setEditorInitializing(false);
          setFirstSaveDone(false);
          return;
        }

        // Load existing notebook
        if (urlIdentifier && urlIdentifier !== 'new' && urlIdentifier !== 'create') {
          console.log('Loading notebook with identifier:', urlIdentifier);
          try {
            await fetchNotebookData();
          } catch (error) {
            console.error('Error in loadNotebook:', error);
            // Handle password requirement as fallback
            if (error.message && (error.message.includes('password') || error.message.includes('access'))) {
              console.log('Access error detected - showing password prompt');
              setRequiresPassword(true);
              setIsAccessPromptOpen(true);
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Critical error in loadNotebook:', error);
        setIsLoading(false);
        showNotification('Failed to load or create notebook', 'error');
      }
    };

    loadNotebook();
  }, [urlIdentifier_from_url, fetchNotebookData]);

  const handleSave = async (settingsData = {}, isManualSave = true) => {
    // Don't save if already saving
    if (isSaving) return;

    setIsSaving(true);
    
    // Prepare data for save
    const dirtyData = {
      title,
      content: prepareContentForBackend(content),
      editorMode,
      language,
      autoSave,
      ...settingsData,
    };
    console.log('[NotebookEditor] Saving notebook with language:', language);

    try {
      let response;
      
      // If this is the first save and we're in new mode, create the notebook
      if (!firstSaveDone && mode === 'new') {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');

        // Create new notebook
        response = await axios.post(`${API_BASE_URL}/api/notebooks`, {
          ...dirtyData,
          permissions: 'private'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Redirect to the permanent URL
        const { urlIdentifier: newId } = response.data;
        navigate(`/Notebook/${newId}`, { replace: true });
      } else {
        // Normal save for existing notebook
        const cleanData = cleanDataForSave(dirtyData);
        response = await saveNotebook(notebookData._id, cleanData);
      }

      if (response && response.data && response.data.notebook) {
        console.log('[NotebookEditor] Notebook saved, response language:', response.data.notebook.language);
        lastSavedContent.current = content;
        setHasUnsavedChanges(false);
      }
      setFirstSaveDone(true);
      // Set the last saved time to now
      setLastSavedTime(new Date().toISOString());
      showNotification('Your notebook has been saved', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to save notebook', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut handlers
  useEffect(() => {
    const shortcuts = {
      SAVE: () => {
        if (!isSaving) {
          handleSave();
          showNotification('Saving notebook...', 'info');
        } else {
          showNotification('Already saving...', 'info');
        }
      },
      TOGGLE_AUTOSAVE: () => {
        setAutoSave(prev => !prev);
        showNotification(`Auto-save ${!autoSave ? 'enabled' : 'disabled'}`, autoSave ? 'warning' : 'success');
      },
      TOGGLE_EDITOR: () => {
        setEditorMode(prev => prev === 'quill' ? 'code' : 'quill');
        showNotification(`Switched to ${editorMode === 'quill' ? 'code' : 'rich text'} editor`, 'info');
      },
      SHOW_SHORTCUTS: () => {
        setIsKeyboardShortcutsOpen(true);
      },
      OPEN_SETTINGS: () => {
        setIsSettingsOpen(true);
      }
    };

    const handleKeyDown = (event) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        if (isKeyboardShortcutsOpen) {
          setIsKeyboardShortcutsOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
      }

      // Don't handle shortcuts in input fields or when typing in editor
      if (['input', 'textarea'].includes(event.target.tagName.toLowerCase()) ||
        event.target.isContentEditable) {
        return;
      }

      // Handle registered shortcuts
      Object.entries(KeyboardShortcuts).forEach(([shortcut, config]) => {
        if (isKeyboardShortcut(event, config) && shortcuts[shortcut]) {
          event.preventDefault();
          shortcuts[shortcut]();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoSave, editorMode, handleSave, isKeyboardShortcutsOpen, isSettingsOpen]);


  // Unified handler for editor mode change (used by both EnhancedEditor and the button)
  // Utility to convert HTML to plain text, preserving newlines
  const htmlToPlainText = (html) => {
    if (!html) return '';
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/\n{2,}/g, '\n');
    return text.trim();
  };

  const handleEditorModeChange = (newMode) => {
    if (newMode === (editorMode === 'quill' ? 'rich' : 'code')) return; // No change
    if (editorMode === 'quill' && newMode === 'code') {
      // Convert HTML to plain text for code mode
      setContent(htmlToPlainText(content));
      setEditorMode('monaco');
      setLanguage('javascript');
      showNotification('Switched to code editor', 'success');
    } else if (editorMode === 'monaco' && newMode === 'rich') {
      // Convert plain text (with newlines) to HTML for Quill
      const plain = content || '';
      // Replace newlines with <br> and wrap in <p>
      const html = '<p>' + plain.replace(/\n/g, '<br>') + '</p>';
      setContent(html);
      setEditorMode('quill');
      showNotification('Switched to rich text editor', 'success');
    }
  };

  // Enhanced content change handlers with typing indicators
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);

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
        socketClient.startTyping(notebookData._id);
      }, 2000);

      setTypingTimeout(newTimeout);
    }
  }, [isConnected, notebookData._id, typingTimeout]);

  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);

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

  // These handlers have been removed as they're no longer needed
  // The functionality is now directly implemented in the EnhancedPasswordPrompt component
  // and the onSuccess callback prop
  
  // Failsafe mechanism to force password prompt if automated detection fails
  useEffect(() => {
    if (notebookData) {
      // Check for any access requirements that need the prompt
      const needsGuestName = notebookData.requiresGuestName && !isAuthenticated;
      const needsPassword = !!notebookData.requiresPassword;
      
      if ((needsGuestName || needsPassword) && !isAccessPromptOpen) {
        console.log('Failsafe: Access prompt required but not shown, forcing prompt', {
          requiresGuestName: notebookData.requiresGuestName,
          requiresPassword: notebookData.requiresPassword,
          isAuthenticated,
          needsGuestName,
          needsPassword
        });
        
        setRequiresGuestName(needsGuestName);
        setRequiresPassword(needsPassword);
        setIsAccessPromptOpen(true);
      }
    }
  }, [notebookData, isAccessPromptOpen, isAuthenticated]);

  // UI Rendering
  const renderMainContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}>
          <Portal>
            <LinearProgress 
              sx={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 9999,
                height: 3,
                background: 'linear-gradient(90deg, #f0f4ff, #ffffff)'
              }} 
            />
          </Portal>
          <LoadingOverlay open={true} message={loadingMessage} />
          <PulseLoader size="medium" color="primary" />
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ mt: 2, opacity: 0.7 }}
          >
            {loadingMessage}
          </Typography>
        </Box>
      );
    }

    if (editorInitializing) {
      return (
        <Box sx={{ 
          width: '100%', 
          height: '100%', 
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <LinearProgress 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #f0f4ff, #e3eaff)'
            }} 
          />
          <EditorSkeleton />
        </Box>
      );
    }

    // Add keyboard shortcut button
    const handleShowKeyboardShortcuts = (event) => {
      event.preventDefault();
      setIsKeyboardShortcutsOpen(true);
    };

    // Render main notebook editor content
    
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        bgcolor: '#f7f9fc'
      }}>
        {/* Access Prompt */}
        <UnifiedAccessPrompt
          open={isAccessPromptOpen}
          onSuccess={(data, guestData) => {
            // Handle successful authentication
            console.log('%c Access prompt success!', 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px', {
              data, 
              guestData, 
              urlIdentifier
            });
            
            setIsAccessPromptOpen(false);
            setIsLoading(false);
            
            if (guestData) {
              // If guest info was provided
              console.log('Guest access granted:', guestData);
              setGuestInfo(guestData);
              setIsGuestRegistered(true);
              
              // Ensure localStorage is updated
              if (guestData.guestName) {
                localStorage.setItem('guestName', guestData.guestName);
              }
            }
            
            // Initialize notebook with data
            initializeNotebook(data);
            showNotification('Access granted! Welcome to the notebook.', 'success');
          }}
          onClose={() => {
            console.log('Access prompt closed');
            setIsAccessPromptOpen(false);
            // Return to previous page if user cancels
            if (notebookData && !notebookData.hasAccess) {
              navigate(-1);
            }
          }}
          onProceed={(data) => {
            console.log('Access proceeding with:', data);
            // Handle successful access verification
            setIsAccessPromptOpen(false);
            initializeNotebook(data);
          }}
          notebook={notebookData}
          urlIdentifier={urlIdentifier}
          isAuthenticated={isAuthenticated}
          isCollaborator={userRole === 'collaborator' || accessLevel === 'write'}
          requiresGuestName={requiresGuestName}
          requiresPassword={requiresPassword}
        />

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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Fade in={!isLoading} timeout={800}>
                  <TextField
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    variant="standard"
                    placeholder="Untitled Notebook"
                    sx={{ 
                      flexGrow: 1, 
                      mr: 2,
                      ...getAnimationStyles(fadeIn, 'normal'),
                    }}
                    InputProps={{
                      sx: {
                        fontSize: { xs: '1.4rem', sm: '1.7rem' },
                        fontWeight: 600,
                        fontFamily: '"Inter", -apple-system, sans-serif',
                        '&::before': { display: 'none' },
                        '&::after': { display: 'none' },
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.02)',
                        },
                        '&:focus-within': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                          borderRadius: 1,
                          px: 1
                        },
                      }
                    }}
                  />
                </Fade>

                {/* AutoSave Indicator */}
                <Fade in={!isLoading} timeout={1000}>
                  <Box>
                    <AutoSaveIndicator 
                      isSaving={isSaving}
                      lastSavedTime={lastSavedTime}
                      hasUnsavedChanges={hasUnsavedChanges}
                      autoSaveEnabled={autoSave}
                      connectionError={connectionError}
                      isConnected={isConnected}
                    />
                  </Box>
                </Fade>
              </Box>

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

                {/* User Presence */}
                {notebookData._id && (
                  <Box sx={{ ml: 'auto' }}>
                    <EnhancedUserPresence 
                      notebookId={notebookData._id}
                      userRole={userRole}
                      size="small"
                      showDetails={true}
                    />
                  </Box>
                )}

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

              {/* Contextual Help Banner for New Users */}
              {!firstSaveDone && accessLevel !== 'read' && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    borderLeft: `4px solid ${theme.palette.info.main}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    🚀 Welcome! Here's how to get started:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                    • Choose <strong>Rich Text</strong> for notes and documents, <strong>Code Mode</strong> for programming<br />
                    • Enable <strong>Auto-Save</strong> to never lose work • Use <strong>Ctrl+S</strong> to save manually<br />
                    • Click <strong>Settings</strong> to share with others, set passwords, or change permissions
                  </Typography>
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

                  {/* Editor Mode Toggle (animated, matches EnhancedEditor) */}
                  <Box
                    sx={{
                      ...getAnimationStyles(fadeIn, 'normal'),
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <EnhancedEditor.ToggleButtonGroup
                      value={editorMode === 'quill' ? 'rich' : 'code'}
                      exclusive
                      onChange={(e, newMode) => {
                        if (newMode) handleEditorModeChange(newMode);
                      }}
                      size="small"
                      disabled={accessLevel === 'read'}
                      sx={{
                        '& .MuiToggleButton-root': {
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }
                      }}
                    >
                      <EnhancedEditor.ToggleButton value="rich" aria-label="rich text editor">
                        <EditIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Rich
                      </EnhancedEditor.ToggleButton>
                      <EnhancedEditor.ToggleButton value="code" aria-label="code editor">
                        <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Code
                      </EnhancedEditor.ToggleButton>
                    </EnhancedEditor.ToggleButtonGroup>
                  </Box>

                  {accessLevel !== 'read' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                showNotification(`Autosave ${newAutoSave ? 'enabled' : 'disabled'}`, 'success');
                              } catch (error) {
                                console.error('Failed to save autosave setting:', error);
                                setAutoSave(!newAutoSave); // Revert on error
                                showNotification('Failed to save autosave setting', 'error');
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

                      <Tooltip title="Keyboard Shortcuts (Ctrl+/)">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleShowKeyboardShortcuts}
                          startIcon={<KeyboardIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none'
                          }}
                        >
                          Shortcuts
                        </Button>
                      </Tooltip>
                    </Box>
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
              {/* Helpful tips for code mode */}
              {editorMode === 'monaco' && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    💡 Tip: Use Alt+Shift+F to format code • Ctrl+Z/Ctrl+Y for undo/redo • Select language for syntax highlighting
                  </Typography>
                </Box>
              )}

              <EnhancedEditor
                content={content}
                onChange={handleContentChange}
                onSave={handleSave}
                editorMode={editorMode === 'quill' ? 'rich' : 'code'}
                language={language}
                autoSave={autoSave}
                placeholder="Start writing your notebook..."
                readOnly={accessLevel === 'read'}
                onLanguageChange={setLanguage}
                onModeChange={handleEditorModeChange}
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
                  color="error"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={userRole !== 'owner' && accessLevel !== 'owner'}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'rgba(239,68,68,0.5)',
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.main',
                      backgroundColor: 'rgba(239,68,68,0.08)',
                    },
                    display: { xs: 'none', md: 'flex' }
                  }}
                >
                  Delete
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => setIsVersionHistoryOpen(true)}
                  startIcon={<HistoryIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'rgba(0,0,0,0.15)',
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  History
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setIsCommentsPanelOpen(true)}
                  startIcon={<CommentIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'rgba(0,0,0,0.15)',
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  Comments
                </Button>

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
                  onClick={() => handleSave()}
                  startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={(autoSave && content === lastSavedContent.current) || isSaving}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    background: isSaving 
                      ? 'linear-gradient(45deg, #4caf50, #2e7d32)'
                      : 'linear-gradient(45deg, #2196f3, #1976d2)',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      animation: isSaving ? 'ripple 1.5s infinite' : 'none',
                    },
                    '@keyframes ripple': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(100%)' }
                    },
                    '&:hover': {
                      background: isSaving 
                        ? 'linear-gradient(45deg, #43a047, #2e7d32)'
                        : 'linear-gradient(45deg, #1976d2, #1565c0)',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
                    }
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
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
              <EnhancedUserPresence
                notebookId={notebookData._id}
                userRole={notebookData.userRole || 'viewer'}
                showDetails={true}
              />
            </Box>
          </Fade>
        )}

        {/* Password dialog has been replaced with EnhancedPasswordPrompt */}
        
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

        {/* Saving Indicator Backdrop */}
        <Backdrop
          open={isSaving}
          sx={{ 
            color: '#fff',
            zIndex: theme => theme.zIndex.drawer + 1,
            backdropFilter: 'blur(3px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PulseLoader size="large" color="primary" />
          <Typography
            variant="h6"
            sx={{ 
              mt: 2, 
              color: 'white',
              fontWeight: 500,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              ...getAnimationStyles(fadeIn, 'slow')
            }}
          >
            Saving your notebook...
          </Typography>
        </Backdrop>

        {/* Notification Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  };

  return (
    <ErrorBoundary>
      {renderMainContent()}
      <KeyboardShortcutsDialog 
        open={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
      <DeleteNotebookDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        notebookTitle={title}
        isDeleting={isDeleting}
        onConfirm={async () => {
          try {
            setIsDeleting(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookData._id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              throw new Error('Failed to delete notebook');
            }
            
            showNotification('Notebook deleted successfully', 'success');
            setTimeout(() => navigate('/notebooks'), 1500);
          } catch (error) {
            showNotification(error.message || 'Failed to delete notebook', 'error');
          } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
          }
        }}
      />

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        notebookId={notebookData._id}
        onVersionRestore={async (versionId) => {
          try {
            const token = localStorage.getItem('token');
            await axios.post(
              `${API_BASE_URL}/api/notebooks/${notebookData._id}/versions/${versionId}/restore`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            showNotification('Version restored successfully', 'success');
            await fetchNotebookData();
            setIsVersionHistoryOpen(false);
          } catch (error) {
            console.error('Error restoring version:', error);
            showNotification('Failed to restore version', 'error');
          }
        }}
        onCompareVersions={(oldVersionId, newVersionId) => {
          setCompareVersions({ oldId: oldVersionId, newId: newVersionId });
          setIsVersionComparisonOpen(true);
          setIsVersionHistoryOpen(false);
        }}
      />

      {/* Version Comparison Dialog */}
      <VersionComparisonDialog
        open={isVersionComparisonOpen}
        onClose={() => {
          setIsVersionComparisonOpen(false);
          setIsVersionHistoryOpen(true);
        }}
        notebookId={notebookData._id}
        oldVersionId={compareVersions.oldId}
        newVersionId={compareVersions.newId}
        onVersionRestore={async (versionId) => {
          try {
            const token = localStorage.getItem('token');
            await axios.post(
              `${API_BASE_URL}/api/notebooks/${notebookData._id}/versions/${versionId}/restore`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            showNotification('Version restored successfully', 'success');
            await fetchNotebookData();
            setIsVersionComparisonOpen(false);
          } catch (error) {
            console.error('Error restoring version:', error);
            showNotification('Failed to restore version', 'error');
          }
        }}
      />

      {/* Comments Panel Drawer */}
      <Drawer
        anchor="right"
        open={isCommentsPanelOpen}
        onClose={() => setIsCommentsPanelOpen(false)}
        sx={{
          width: 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 350,
            boxSizing: 'border-box',
            overflowY: 'hidden',
            height: '100%',
          },
          zIndex: theme => theme.zIndex.drawer
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          p: 1
        }}>
          <IconButton 
            onClick={() => setIsCommentsPanelOpen(false)}
            size="small"
            aria-label="close comments"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 'calc(100% - 48px)' }}>
          {notebookData._id && (
            <CommentsPanel 
              notebookId={notebookData._id} 
              userRole={userRole} 
              accessLevel={accessLevel} 
              isGuest={!isAuthenticated || !!guestInfo}
            />
          )}
        </Box>
      </Drawer>
    </ErrorBoundary>
  );
};

export default withErrorBoundary(NotebookEditor);