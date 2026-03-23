import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  IconButton,
  Container,
  Alert,
  Snackbar,
  Chip,
  Paper,
  alpha,
  Avatar,
  Stack,
  Divider,
  Tooltip,
  Fab,
  Skeleton,
  Card,
  CardContent,
  CardActions,
  Badge,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Add,
  BookOutlined,
  SortOutlined,
  ViewModule,
  ViewList,
  Refresh,
  AutoAwesome,
  Create,
  Label as LabelIcon,
  MoreVert,
  Edit,
  Delete,
  Share,
  AccessTime,
  Lock,
  People,
  Public,
  KeyboardArrowDown,
  Dashboard,
  Star,
  StarBorder,
  Code,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteNotebookDialog from '../Components/DeleteNotebookDialog';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Notebook card component
const NotebookCard = ({ notebook, onEdit, onDelete, onShare, onToggleFavorite, index }) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const permissionIcons = {
    everyone: <Public sx={{ fontSize: 14 }} />,
    collaborators: <People sx={{ fontSize: 14 }} />,
    private: <Lock sx={{ fontSize: 14 }} />,
  };

  const permissionColors = {
    everyone: theme.palette.success.main,
    collaborators: theme.palette.warning.main,
    private: theme.palette.error.main,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
            transform: 'translateY(-4px)',
          },
        }}
        onClick={() => onEdit(notebook)}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
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
              <BookOutlined sx={{ color: theme.palette.primary.main }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={notebook.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(notebook._id);
                  }}
                >
                  {notebook.isFavorite ? (
                    <Star sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                  ) : (
                    <StarBorder sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAnchor(e.currentTarget);
                }}
              >
                <MoreVert sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            fontWeight={600}
            noWrap
            sx={{ mb: 1 }}
          >
            {notebook.title || 'Untitled'}
          </Typography>

          {/* Preview */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
              lineHeight: 1.6,
              minHeight: 44,
            }}
          >
            {notebook.content?.replace(/<[^>]+>/g, '').slice(0, 100) || 'No content'}
          </Typography>

          {/* Tags */}
          {notebook.tags && notebook.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
              {notebook.tags.slice(0, 2).map((tag, i) => (
                <Chip
                  key={i}
                  label={typeof tag === 'string' ? tag : tag.name}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    borderRadius: 1,
                  }}
                />
              ))}
              {notebook.tags.length > 2 && (
                <Chip
                  label={`+${notebook.tags.length - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', borderRadius: 1 }}
                />
              )}
            </Box>
          )}
        </CardContent>

        <Divider />

        <CardActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={permissionIcons[notebook.permissions] || <Public sx={{ fontSize: 14 }} />}
              label={notebook.permissions || 'public'}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                borderRadius: 1.5,
                color: permissionColors[notebook.permissions],
                borderColor: permissionColors[notebook.permissions],
                '& .MuiChip-icon': { color: permissionColors[notebook.permissions] },
              }}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </CardActions>
      </Card>

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => { onEdit(notebook); setMenuAnchor(null); }}>
          <Edit sx={{ mr: 1, fontSize: 18 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { onShare(notebook); setMenuAnchor(null); }}>
          <Share sx={{ mr: 1, fontSize: 18 }} /> Share
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { onDelete(notebook); setMenuAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1, fontSize: 18 }} /> Delete
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

// Skeleton loader
const NotebookCardSkeleton = () => (
  <Card sx={{ height: '100%', borderRadius: 3 }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2 }} />
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
      <Skeleton variant="text" width="70%" height={28} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
    </CardContent>
  </Card>
);

const NotebooksDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Fetch notebooks
  const fetchNotebooks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth?mode=login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/notebooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotebooks(response.data.notebooks || []);
    } catch (err) {
      console.error('Error fetching notebooks:', err);
      setError('Failed to load notebooks');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  // Filter notebooks
  const filteredNotebooks = notebooks.filter((nb) => {
    const matchesSearch = nb.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nb.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (currentFilter === 'favorites') {
      return matchesSearch && favorites.includes(nb._id);
    }
    if (currentFilter === 'shared') {
      return matchesSearch && nb.creatorID !== JSON.parse(localStorage.getItem('user') || '{}').id;
    }
    return matchesSearch;
  });

  // Handle create notebook
  const handleCreateNotebook = async (editorMode = 'quill') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/notebooks`,
        {
          title: 'Untitled Notebook',
          content: '',
          editorMode,
          permissions: 'everyone',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const notebook = response.data.notebook || response.data;
      navigate(`/Notebook/${notebook.urlIdentifier}`);
    } catch (err) {
      console.error('Error creating notebook:', err);
      setSnackbar({ open: true, message: 'Failed to create notebook', severity: 'error' });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!notebookToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/notebooks/${notebookToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotebooks((prev) => prev.filter((nb) => nb._id !== notebookToDelete._id));
      setSnackbar({ open: true, message: 'Notebook deleted', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
    }
  };

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: alpha(theme.palette.background.default, 0.98) }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component={Link}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  SyncNote
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                <Dashboard sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
                My Notebooks
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                component={Link}
                to="/profile"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Profile
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/');
                }}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Search and filters */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <TextField
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, maxWidth: 400 },
              }}
              sx={{ flex: 1, maxWidth: 400 }}
            />

            <Button
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              endIcon={<KeyboardArrowDown />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {currentFilter === 'all' ? 'All' : currentFilter === 'favorites' ? 'Favorites' : 'Shared'}
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
            >
              <MenuItem onClick={() => { setCurrentFilter('all'); setFilterAnchor(null); }}>
                All Notebooks
              </MenuItem>
              <MenuItem onClick={() => { setCurrentFilter('favorites'); setFilterAnchor(null); }}>
                <Star sx={{ mr: 1, fontSize: 18, color: theme.palette.warning.main }} /> Favorites
              </MenuItem>
              <MenuItem onClick={() => { setCurrentFilter('shared'); setFilterAnchor(null); }}>
                <People sx={{ mr: 1, fontSize: 18 }} /> Shared with me
              </MenuItem>
            </Menu>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Grid view">
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <ViewModule />
              </IconButton>
            </Tooltip>
            <Tooltip title="List view">
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ViewList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchNotebooks}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Notebooks grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <NotebookCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : filteredNotebooks.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 10,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              borderRadius: 4,
              border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            }}
          >
            <BookOutlined sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {searchQuery ? 'No notebooks found' : 'No notebooks yet'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first notebook to get started'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleCreateNotebook()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                }}
              >
                Create Notebook
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            <AnimatePresence>
              {filteredNotebooks.map((notebook, index) => (
                <Grid item xs={12} sm={6} md={4} key={notebook._id}>
                  <NotebookCard
                    notebook={notebook}
                    onEdit={(nb) => navigate(`/Notebook/${nb.urlIdentifier}`)}
                    onDelete={(nb) => { setNotebookToDelete(nb); setDeleteDialogOpen(true); }}
                    onShare={(nb) => navigate(`/Notebook/${nb.urlIdentifier}`)}
                    onToggleFavorite={toggleFavorite}
                    index={index}
                  />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Container>

      {/* FAB for creating new notebook */}
      <Fab
        color="primary"
        onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        }}
      >
        <Add />
      </Fab>

      <Menu
        anchorEl={createMenuAnchor}
        open={Boolean(createMenuAnchor)}
        onClose={() => setCreateMenuAnchor(null)}
      >
        <MenuItem onClick={() => { handleCreateNotebook('quill'); setCreateMenuAnchor(null); }}>
          <Create sx={{ mr: 1 }} /> Rich Text Notebook
        </MenuItem>
        <MenuItem onClick={() => { handleCreateNotebook('code'); setCreateMenuAnchor(null); }}>
          <Code sx={{ mr: 1 }} /> Code Notebook
        </MenuItem>
      </Menu>

      {/* Delete dialog */}
      <DeleteNotebookDialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setNotebookToDelete(null); }}
        notebookTitle={notebookToDelete?.title || 'Untitled'}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Snackbar */}
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
  );
};

export default NotebooksDashboard;