import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Box,
  Chip,
  Paper,
  Tabs,
  Tab,
  Grid,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  CompareArrows as CompareIcon,
  Restore as RestoreIcon,
  Code as CodeIcon,
  ViewModule as SideBySideIcon,
  ViewStream as UnifiedViewIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';

// Required for syntax highlighting
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('html', html);

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const VersionComparisonDialog = ({ open, onClose, notebookId, oldVersionId, newVersionId, onVersionRestore }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [oldVersion, setOldVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const [diffMode, setDiffMode] = useState('split'); // 'split' or 'unified'
  const [viewMode, setViewMode] = useState('diff'); // 'diff' or 'content'

  // Fetch versions on open
  useEffect(() => {
    if (open && notebookId && oldVersionId && newVersionId) {
      fetchVersions();
    }
  }, [open, notebookId, oldVersionId, newVersionId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Fetch both versions in parallel
      const [oldResponse, newResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/notebooks/${notebookId}/versions/${oldVersionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/notebooks/${notebookId}/versions/${newVersionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setOldVersion(oldResponse.data);
      setNewVersion(newResponse.data);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setError('Failed to load versions for comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (versionId) => {
    if (onVersionRestore) {
      onVersionRestore(versionId);
      onClose();
    }
  };

  const renderDiff = () => {
    if (!oldVersion || !newVersion) return null;
    
    try {
      // Generate a unified diff string
      const diffString = generateDiffString(
        oldVersion.content || '',
        newVersion.content || '',
        oldVersion.version,
        newVersion.version
      );
      
      const files = parseDiff(diffString);
      
      return files.map((file, i) => (
        <Box key={i} sx={{ mb: 2, overflow: 'auto' }}>
          <Diff 
            viewType={diffMode} 
            diffType={file.type} 
            hunks={file.hunks}
            tokens={file.tokens}
          >
            {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
          </Diff>
        </Box>
      ));
    } catch (e) {
      console.error('Error rendering diff:', e);
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Error generating diff view. The content may be too large or in an incompatible format.
        </Alert>
      );
    }
  };

  const generateDiffString = (oldText, newText, oldVersion, newVersion) => {
    // Simple diff format
    return `diff --git a/notebook-v${oldVersion} b/notebook-v${newVersion}
--- a/notebook-v${oldVersion}
+++ b/notebook-v${newVersion}
${createUnifiedDiff(oldText, newText)}`;
  };

  // Simplified diff creation (not a complete unified diff algorithm, but works for our purpose)
  const createUnifiedDiff = (oldText, newText) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    let diffOutput = `@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
    
    // This is a simplified approach - for a real application, use a proper diff algorithm
    oldLines.forEach(line => {
      if (!newLines.includes(line)) {
        diffOutput += `-${line}\n`;
      }
    });
    
    newLines.forEach(line => {
      if (!oldLines.includes(line)) {
        diffOutput += `+${line}\n`;
      } else if (oldLines.includes(line)) {
        diffOutput += ` ${line}\n`;
      }
    });
    
    return diffOutput;
  };

  const renderContent = () => {
    if (!oldVersion || !newVersion) return null;
    
    // Determine language for syntax highlighting
    const getLanguageFromEditorMode = (editorMode) => {
      switch (editorMode) {
        case 'monaco':
          return 'javascript';
        case 'markdown':
          return 'markdown';
        case 'html':
          return 'html';
        default:
          return 'text';
      }
    };
    
    const oldLanguage = getLanguageFromEditorMode(oldVersion.editorMode);
    const newLanguage = getLanguageFromEditorMode(newVersion.editorMode);
    
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              height: '100%', 
              borderLeft: `4px solid ${theme.palette.error.main}`,
              overflow: 'auto',
              maxHeight: '60vh'
            }}
          >
            <Typography variant="subtitle2" gutterBottom color="error">
              Version {oldVersion.version}
              <Typography variant="caption" component="span" sx={{ ml: 1 }}>
                ({formatDistanceToNow(new Date(oldVersion.createdAt), { addSuffix: true })})
              </Typography>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <SyntaxHighlighter 
                language={oldLanguage} 
                style={docco}
                customStyle={{ 
                  borderRadius: '4px',
                  fontSize: '13px',
                  lineHeight: '1.5' 
                }}
              >
                {oldVersion.content || ''}
              </SyntaxHighlighter>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              height: '100%', 
              borderLeft: `4px solid ${theme.palette.success.main}`,
              overflow: 'auto',
              maxHeight: '60vh'
            }}
          >
            <Typography variant="subtitle2" gutterBottom color="success">
              Version {newVersion.version}
              <Typography variant="caption" component="span" sx={{ ml: 1 }}>
                ({formatDistanceToNow(new Date(newVersion.createdAt), { addSuffix: true })})
              </Typography>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <SyntaxHighlighter 
                language={newLanguage} 
                style={docco}
                customStyle={{ 
                  borderRadius: '4px',
                  fontSize: '13px',
                  lineHeight: '1.5' 
                }}
              >
                {newVersion.content || ''}
              </SyntaxHighlighter>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
          height: '80vh',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: theme => theme.palette.primary.main,
        color: 'white',
        px: 3,
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareIcon />
          <Typography variant="h6">Compare Versions</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {loading ? (
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </DialogContent>
      ) : error ? (
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
      ) : (
        <>
          <Box 
            sx={{ 
              px: 3, 
              py: 1, 
              borderBottom: theme => `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tabs 
                value={viewMode} 
                onChange={(e, newValue) => setViewMode(newValue)}
                aria-label="view mode tabs"
              >
                <Tab 
                  icon={<CompareIcon fontSize="small" />} 
                  iconPosition="start" 
                  label="Diff View" 
                  value="diff"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  icon={<CodeIcon fontSize="small" />} 
                  iconPosition="start" 
                  label="Content View" 
                  value="content"
                  sx={{ minHeight: 48 }}
                />
              </Tabs>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {viewMode === 'diff' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    color={diffMode === 'split' ? 'primary' : 'default'}
                    onClick={() => setDiffMode('split')}
                    size="small"
                    title="Side by side view"
                  >
                    <SideBySideIcon />
                  </IconButton>
                  <IconButton
                    color={diffMode === 'unified' ? 'primary' : 'default'}
                    onClick={() => setDiffMode('unified')}
                    size="small"
                    title="Unified view"
                  >
                    <UnifiedViewIcon />
                  </IconButton>
                </Box>
              )}

              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`v${oldVersion?.version || '?'}`} 
                  size="small" 
                  variant="outlined" 
                />
                <ArrowForwardIcon fontSize="small" color="action" />
                <Chip 
                  label={`v${newVersion?.version || '?'}`} 
                  size="small"
                  color="primary"
                />
              </Box>
            </Box>
          </Box>

          <DialogContent sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
            {viewMode === 'diff' ? renderDiff() : renderContent()}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: theme => `1px solid ${theme.palette.divider}` }}>
            <Button 
              onClick={onClose} 
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 1 }}
            >
              Back to History
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              onClick={() => handleRestore(oldVersionId)}
              variant="outlined"
              startIcon={<RestoreIcon />}
              color="secondary"
              sx={{ borderRadius: 1, mr: 1 }}
            >
              Restore Older Version
            </Button>
            <Button 
              onClick={() => handleRestore(newVersionId)}
              variant="contained"
              startIcon={<RestoreIcon />}
              color="primary"
              sx={{ borderRadius: 1 }}
            >
              Restore Newer Version
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default VersionComparisonDialog;