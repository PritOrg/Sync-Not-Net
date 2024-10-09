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
import Swal from 'sweetalert2';
import bcrypt from 'bcryptjs';

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

const socket = io('http://localhost:5000'); // Replace with your backend URL

function NotebookEditor() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [useQuill, setUseQuill] = useState(true);
  const [saveMessage, setSaveMessage] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editorChangeWarning, setEditorChangeWarning] = useState(false);
  const [permissions, setPermissions] = useState('creator-only');
  const [collaborators, setCollaborators] = useState([]);
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [notebookHasPassword, setNotebookHasPassword] = useState(false);
  const navigate = useNavigate();
  const saveTimeout = useRef(null);
  const location = useLocation();
  const notebookId = location.state?.notebookId;

  useEffect(() => {
    if (notebookId) {
      checkNotebookAccess(notebookId);
    }
  }, [notebookId]);

  useEffect(() => {
    if (content || title) {
      if (autoSave && accessGranted) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(handleAutoSave, 2000);
      }
    }
  }, [content, title, autoSave, accessGranted]);

  const checkNotebookAccess = (id) => {
    fetch(`http://localhost:5000/api/notebooks/${id}/access`, {
      headers: { Authorization: localStorage.getItem('token') },
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.requiresPassword) {
          setNotebookHasPassword(true);
          const { value: enteredPassword } = await Swal.fire({
            title: 'Enter Notebook Password',
            input: 'password',
            inputPlaceholder: 'Enter your password',
            inputAttributes: {
              autocapitalize: 'off',
              autocorrect: 'off',
            },
            showCancelButton: true,
            confirmButtonText: 'Submit',
          });

          if (enteredPassword && bcrypt.compareSync(enteredPassword, data.password)) {
            setAccessGranted(true);
            setTitle(data.title);
            setContent(data.content);
            setCollaborators(data.collaborators);
            setPermissions(data.permissions);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Access Denied',
              text: 'Incorrect password!',
            });
            navigate('/notebooks'); // Redirect user if access is denied
          }
        } else {
          setAccessGranted(true);
          setTitle(data.title);
          setContent(data.content);
          setCollaborators(data.collaborators);
          setPermissions(data.permissions);
        }
      })
      .catch(() => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to access notebook.',
        });
      });
  };

  const handleSave = () => {
    if (!notebookId) {
      setOpenDialog(true);
    } else {
      if (accessGranted) {
        socket.emit('updateNotebook', notebookId, { title, content });
        setSaveMessage(true);
      }
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
      collaborators,
      password,
      tags: tags.split(',').map((tag) => tag.trim()),
    };

    fetch('http://localhost:5000/api/notebooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('token'),
      },
      body: JSON.stringify(newNotebook),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        navigate('/notebook', { state: { notebookId: data._id } });
      })
      .catch(() => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create notebook.',
        });
      });

    setOpenDialog(false);
    setSaveMessage(true);
  };

  const handleAutoSave = () => {
    if (content || title) {
      if (accessGranted) {
        socket.emit('updateNotebook', notebookId, { title, content });
      }
    }
  };

  const toggleEditor = () => {
    setEditorChangeWarning(true);
  };

  const handleEditorChangeConfirmation = (confirm) => {
    setEditorChangeWarning(false);
    if (confirm) {
      setUseQuill(!useQuill);
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
        sx={{ marginBottom: '10px', backgroundColor: '#61dafb', color: '#000' }}
        onClick={toggleEditor}
      >
        {useQuill ? 'Switch to Code Editor' : 'Switch to Text Editor'}
      </Button>

      <FormControlLabel
        control={
          <Switch
            checked={autoSave}
            onChange={handleAutoSaveToggle}
            color="primary"
            sx={{ marginLeft: '20px' }}
          />
        }
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
              fontSize: 20,
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

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Notebook Settings</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Collaborators"
            fullWidth
            value={collaborators}
            onChange={(e) => setCollaborators(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Permissions"
            fullWidth
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Tags"
            fullWidth
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editorChangeWarning}>
        <DialogTitle>Switch Editor</DialogTitle>
        <DialogContent>
          <Typography>
            Switching editor will change your formatting. Please copy your content before switching.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleEditorChangeConfirmation(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => handleEditorChangeConfirmation(true)} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default NotebookEditor;
