import React, { useState, useEffect, useRef } from 'react';
import {
  Switch,
  Button,
  TextField,
  FormControlLabel,
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  AutoMode as AutoSaveIcon,
  Code as CodeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Editor } from '@monaco-editor/react';
import SettingsDialog from './SettingsDialog';
import PasswordPrompt from './PasswordPrompt';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
const API_BASE_URL = 'http://localhost:5000';

const saveThrottleInterval = 5000; // Throttle save every 5 seconds
const typingDelay = 100; // Throttle typing check every 100ms

const NotebookEditor = () => {

  const { urlIdentifier: urlIdentifier_from_url } = useParams();
  const navigate = useNavigate();

  const [urlIdentifier, setUrlIdentifier] = useState(urlIdentifier_from_url);

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [editorMode, setEditorMode] = useState('quill');
  const [autoSave, setAutoSave] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [notebookData, setNotebookData] = useState({});
  const [firstSaveDone, setFirstSaveDone] = useState(false);
  const socket = io(API_BASE_URL);


  const saveTimer = useRef(null);
  const typingTimer = useRef(null);
  const lastSavedContent = useRef(content);

  // Function to generate a random URL identifier
  const generateRandomIdentifier = () => {
    return Math.random().toString(36).substring(2, 10); // Generates a random string
  };

  useEffect(() => {
    socket.emit('joinNotebook', notebookData._id);

    socket.on('notebookUpdated', (updatedData) => {
      if (updatedData._id === notebookData._id) {
        setTitle(updatedData.title);
        setContent(updatedData.content);
      }
    });
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      Swal.fire('Error!', 'Connection error occurred', 'error');
    });
  
    return () => {
      socket.off('notebookUpdated');
      socket.off('error');
      socket.disconnect();  
    };
  }, [notebookData._id]);

  const handleSave = async (settingsData = {}) => {
    if (!firstSaveDone) setIsSettingsOpen(true);
  
    Swal.fire({
      title: 'Save Notebook?',
      text: "Do you want to save the changes?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Save',
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Create a clean data object
        const dirtyData = {
          title,
          content,
          editorMode,
          autoSave,
          ...settingsData,
        };
        
        // Clean the data before saving
        const cleanData = cleanDataForSave(dirtyData);
        
        try {
          await saveNotebook(notebookData._id, cleanData);
          setFirstSaveDone(true);
          Swal.fire('Saved!', 'Your notebook has been saved.', 'success');
        } catch (error) {
          Swal.fire('Error!', error.message, 'error');
        }
      }
    });
  };

  const handleEditorSwitch = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Switching editor will affect formatting. Copy content if needed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, switch it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setEditorMode(prev => (prev === 'quill' ? 'monaco' : 'quill'));
      }
    });
  };

  const handleRealTimeSave = () => {
    if (autoSave && firstSaveDone) {
      clearTimeout(typingTimer.current);
  
      typingTimer.current = setTimeout(() => {
        if (content !== lastSavedContent.current) {
          clearTimeout(saveTimer.current);
  
          saveTimer.current = setTimeout(() => {
            // Create a clean update object
            const updatedContent = {
              title,
              content,
              notebookId: notebookData._id // Include only if needed by your backend
            };
            
            socket.emit('updateNotebook', notebookData._id, updatedContent);
            lastSavedContent.current = content;
          }, saveThrottleInterval);
        }
      }, typingDelay);
    }
  };

  useEffect(() => {
    handleRealTimeSave();
  }, [title, content]);

  const searchCollaborators = async (query) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?query=${query}`, {
        headers: {
          "Authorization": token,
        },
      });
      if (!response.ok) {
        throw new Error('Error fetching collaborators.');
      }
      return await response.json();
    } catch (error) {
      Swal.fire('Error!', error.message, 'error');
      return [];
    }
  };

  // Function to fetch notebook data by identifier
  const fetchNotebookData = async (identifier) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${identifier}/access`, {
        headers: {
          "Authorization": token,
        },
      });
      if (!response.ok) {
        throw new Error('Notebook not found');
      }
      setFirstSaveDone(true);
      return await response.json();
    } catch (error) {
      return null;
    }
  };
  const cleanDataForSave = (data) => {
    // Create a clean object with only the necessary properties
    return {
      title: data.title,
      content: data.content,
      editorMode: data.editorMode,
      autoSave: data.autoSave,
      // Add any other necessary fields from settingsData
      password: data.password,
      requiresPassword: data.requiresPassword,
      collaborators: data.collaborators,
      urlIdentifier: data.urlIdentifier,
      // Add any other fields you need to save
    };
  };
  const saveNotebook = async (notebookId, data) => {
    const token = localStorage.getItem('token');
    try {
      const endpoint = firstSaveDone 
        ? `${API_BASE_URL}/api/notebooks/${notebookId}`
        : `${API_BASE_URL}/api/notebooks/`;
      
      const response = await fetch(endpoint, {
        method: firstSaveDone ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          "Authorization": token 
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error saving notebook.');
      }
  
      const savedData = await response.json();
      return savedData;
    } catch (error) {
      console.error('Save error:', error);
      throw new Error(error.message || 'Error saving notebook.');
    }
  };


  const saveURL = async (notebookId, newURL) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', "Authorization": token },
        body: JSON.stringify({ urlIdentifier: newURL }),
      });
      if (!response.ok) {
        throw new Error('Error saving URL.');
      }
    } catch (error) {
      Swal.fire('Error!', error.message, 'error');
    }
  };

  useEffect(() => {
    const loadNotebook = async () => {
      const data = await fetchNotebookData(urlIdentifier);

      if (data) {
        if (data.requiresPassword) {
          setNotebookData({ password: data.password })
          setIsPasswordPromptOpen(true);
        }
        else { initializeNotebook(data); }
      } else if (!urlIdentifier) {
        // Only generate a new identifier if it doesn't already exist
        const newIdentifier = generateRandomIdentifier();
        setUrlIdentifier(newIdentifier);
        navigate(`/Notebook/${newIdentifier}`, { replace: true });
      }

    };
    loadNotebook();
  }, [urlIdentifier_from_url]);
  const initializeNotebook = (data) => {
    console.log(data);

    setNotebookData(data);
    setTitle(data.title);
    setContent(data.content);
    setEditorMode(data.editorMode || 'quill');
    setAutoSave(data.autoSave);

  };

  const quillModules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  };
  return (
    <Box sx={{ height: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            padding: 3,
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(to right, #ffffff, #f8faff)',
          }}
        >
          <TextField
            value={title}
            onChange={e => setTitle(e.target.value)}
            variant="standard"
            placeholder="Untitled Notebook"
            fullWidth
            InputProps={{
              sx: {
                fontSize: '1.5rem',
                fontWeight: 600,
                '&::before': { display: 'none' },
                '&::after': { display: 'none' },
              }
            }}
          />

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mt: 2,
            flexWrap: 'wrap'
          }}>

            {/* Controls Bar */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mt: 2,
              flexWrap: 'wrap'
            }}>
              <Tooltip title={`Switch to ${editorMode === 'quill' ? 'Monaco' : 'Rich Text'} Editor`}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleEditorSwitch}
                  startIcon={editorMode === 'quill' ? <CodeIcon /> : <EditIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'rgba(0,0,0,0.12)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    }
                  }}
                >
                  {editorMode === 'quill' ? 'Code Editor' : 'Rich Text'}
                </Button>
              </Tooltip>

              <Tooltip title={autoSave ? 'Disable Autosave' : 'Enable Autosave'}>
                <Button
                  size="small"
                  variant={autoSave ? 'contained' : 'outlined'}
                  onClick={() => setAutoSave(prev => !prev)}
                  startIcon={<AutoSaveIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    backgroundColor: autoSave ? 'success.main' : 'transparent',
                    '&:hover': {
                      backgroundColor: autoSave ? 'success.dark' : 'rgba(25, 118, 210, 0.04)',
                    }
                  }}
                >
                  Autosave
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Editor Section */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            backgroundColor: editorMode === 'monaco' ? '#1e1e1e' : '#ffffff',
            minHeight: '600px', // Add minimum height
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
              height: '50vh',
              '& .ql-toolbar': {
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                backgroundColor: '#f8faff',
              },
              '& .ql-container': {
                border: 'none',
                fontSize: '16px',
              }
            }}
          >
            {editorMode === 'quill' ? (
              <ReactQuill
                theme="snow"
                modules={quillModules}
                value={content}
                onChange={setContent}
                style={{ height: 'calc(100% - 42px)' }}
              />
            ) : (
              <Editor
                height="100%" // This should be a specific value like "500px" or "70vh"
                theme="vs-dark"
                value={content}
                language='javascript'
                onChange={(value) => setContent(value)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14, // Adjust font size
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  lineHeight: 1.6,
                }}
               
              />
            )}
          </Paper>
        </Box>

        {/* Footer Actions */}
        <Box
          sx={{
            p: 3,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            background: 'linear-gradient(to right, #ffffff, #f8faff)',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setIsSettingsOpen(true)}
            startIcon={<SettingsIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
            }}
          >
            Settings
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976d2, #1565c0)',
              }
            }}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>

      {/* Dialogs */}
      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notebookData={notebookData}
        saveURL={saveURL}
        onSave={handleSave}
        urlIdentifier={urlIdentifier}
        searchCollaborators={searchCollaborators}
      />

      {isPasswordPromptOpen && (
        <PasswordPrompt
          onSuccess={async () => {
            const data = await fetchNotebookData(urlIdentifier);
            if (data) {
              initializeNotebook(data);
            }
          }}
          hashedPassword={notebookData.password}
          onClose={() => setIsPasswordPromptOpen(false)}
        />
      )}
    </Box>
  );
};

export default NotebookEditor;
