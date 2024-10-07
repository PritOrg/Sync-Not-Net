import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Snackbar,
  Switch,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';

const quillModules = {
  toolbar: [
    [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

const socket = io('http://localhost:5000'); // Replace with your backend URL

function NotebookEditor() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [useQuill, setUseQuill] = useState(true);
  const [saveMessage, setSaveMessage] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editorChangeWarning, setEditorChangeWarning] = useState(false); // Warning for editor change

  // New state variables
  const [permissions, setPermissions] = useState('creator-only');
  const [collaborators, setCollaborators] = useState('');
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState('');
  const navigate = useNavigate();
  const saveTimeout = useRef(null);
  const location = useLocation();
  const notebookId = location.state?.notebookId;

  useEffect(() => {
    if (notebookId) {
      fetchNotebook(notebookId);
    }
  }, [notebookId]);

  useEffect(() => {
    if (content || title) {
      if (autoSave) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(handleAutoSave, 2000);
      }
    }
  }, [content, title, autoSave]);

  const fetchNotebook = (id) => {
    socket.emit('joinNotebook', id);
    fetch(`http://localhost:5000/api/notebooks/${id}/access`, {
      headers: { Authorization: localStorage.getItem('token') },
    })
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
      });
  };

  const handleSave = () => {
    if (!notebookId) {
      setOpenDialog(true);
    } else {
      socket.emit('updateNotebook', notebookId, { title, content });
      setSaveMessage(true);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDialogSave = () => {
    const newNotebook = {
      title,
      content,
      permissions,
      collaborators: collaborators.split(',').map(collab => collab.trim()),
      password,
      tags: tags.split(',').map(tag => tag.trim()),
      
    };

    fetch('http://localhost:5000/api/notebooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('token'),
      },
      body: JSON.stringify(newNotebook),
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        
        navigate('/notebook', { state: { notebookId: data._id } });
      });

    setOpenDialog(false);
    setSaveMessage(true);
  };

  const handleAutoSave = () => {
    if (content || title) {
      socket.emit('updateNotebook', notebookId, { title, content });
    }
  };

  const toggleEditor = () => {
    setEditorChangeWarning(true); // Open the warning dialog
  };

  const handleEditorChangeConfirmation = (confirm) => {
    setEditorChangeWarning(false);
    if (confirm) {
      setUseQuill(!useQuill); // Switch the editor
    }
  };

  const handleAutoSaveToggle = () => {
    setAutoSave(!autoSave);
  };

  return (
    <Container
      sx={{
        marginTop: '50px',
        textAlign: 'center',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)',
        background: 'none',
      }}
    >
      <Typography
        variant="h3"
        sx={{ marginBottom: '20px', fontWeight: 'bold', color: '#fecdB0' }}
      >
        <BorderColorIcon /> Sync Notebook
      </Typography>

      <Box sx={{ marginBottom: '30px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          label="Notebook Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          sx={{
            marginBottom: '20px',
            maxWidth: '600px',
            backgroundColor: '#fff',
            borderRadius: '8px',
          }}
        />
      </Box>

      <Button
        variant="contained"
        sx={{ marginBottom: '20px', backgroundColor: '#61dafb', color: '#000' }}
        onClick={toggleEditor}
      >
        {useQuill ? 'Switch to Code Editor' : 'Switch to Text Editor'}
      </Button>

      <FormControlLabel
        control={<Switch checked={autoSave} onChange={handleAutoSaveToggle} />}
        label="Autosave"
        sx={{ marginBottom: '20px' }}
      />

      <Box
        sx={{
          backgroundColor: '#f9f9f9',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '30px',
          minHeight: '400px',
        }}
      >
        {useQuill ? (
          <ReactQuill
            modules={quillModules}
            theme="snow"
            value={content}
            onChange={setContent}
            style={{ height: '400px' }}
          />
        ) : (
          <Editor
            height="400px"
            theme="vs-dark"
            defaultLanguage="javascript"
            value={content}
            onChange={(value) => setContent(value)}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<SaveIcon />}
        onClick={handleSave}
        sx={{ padding: '10px 30px', backgroundColor: '#4caf50' }}
      >
        Save Notebook
      </Button>

      <Snackbar
        open={saveMessage}
        autoHideDuration={3000}
        onClose={() => setSaveMessage(false)}
        message="Notebook saved!"
      />

      {/* Dialog for notebook settings */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Notebook Settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Permissions"
            type="text"
            fullWidth
            variant="outlined"
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
            helperText="e.g., creator-only, anyone"
          />
          <TextField
            margin="dense"
            label="Collaborators (comma-separated)"
            type="text"
            fullWidth
            variant="outlined"
            value={collaborators}
            onChange={(e) => setCollaborators(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Tags (comma-separated)"
            type="text"
            fullWidth
            variant="outlined"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave}>Create Notebook</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for editor change warning */}
      <Dialog open={editorChangeWarning} onClose={() => setEditorChangeWarning(false)}>
        <DialogTitle>Warning: Editor Change</DialogTitle>
        <DialogContent>
          <Typography>
            Changing the editor type will modify the content formatting. Please copy your content before switching to avoid data loss.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleEditorChangeConfirmation(false)}>Cancel</Button>
          <Button onClick={() => handleEditorChangeConfirmation(true)}>Switch Editor</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default NotebookEditor;
