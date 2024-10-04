import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Quill theme
import { Container, Box, Typography, Button, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import { Editor } from '@monaco-editor/react'; // Correct import for Monaco Editor

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

function NotebookEditor() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [useQuill, setUseQuill] = useState(true); // Toggle between editors

  const handleSave = () => {
    console.log('Saving content: ', { title, content });
    // Logic to save the notebook content (POST to backend)
  };

  const toggleEditor = () => {
    setUseQuill(!useQuill); // Toggle the editor on button click
  };

  return (
    <Container sx={{ marginTop: '50px', textAlign: 'center' }}>
      <Typography
        variant="h3"
        sx={{ marginBottom: '20px', fontWeight: 'bold', color: '#fecdB0' }}
      >
        <BorderColorIcon /> Your new Sync Notebook
      </Typography>

      <Box sx={{ marginBottom: '30px', textAlign: 'center' }}>
        <TextField
          variant="outlined"
          label="Notebook Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          sx={{ marginBottom: '20px', maxWidth: '600px' }}
        />
      </Box>

      <Button
        variant="contained"
        sx={{ marginBottom: '20px' }}
        onClick={toggleEditor}
      >
        {useQuill ? 'Switch to Monaco Editor' : 'Switch to Quill'}
      </Button>

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
            theme="vs-dark" // Optional: You can change this to 'light' for a lighter theme
            defaultLanguage="javascript" // Set the default language mode here
            value={content}
            onChange={(value) => setContent(value)}
            options={{
              minimap: { enabled: false }, // Optional: Disable the minimap if you prefer a cleaner look
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
        sx={{ padding: '10px 30px' }}
      >
        Save Notebook
      </Button>
    </Container>
  );
}

export default NotebookEditor;
