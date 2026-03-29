import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  ListItemIcon,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import apiErrorHandler from '../utils/errorHandler';
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
  Group,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteNotebookDialog from '../Components/DeleteNotebookDialog';
import ShareDialog from '../NotebookEditorPage/ShareDialog';
import NotebookUrlSettingsDialog from '../NotebookEditorPage/NotebookUrlSettingsDialog';
import config from '../config';

// Notebook card component - supports both grid and list views
const NotebookCard = ({ notebook, onEdit, onDelete, onShare, onToggleFavorite, index, viewMode = 'grid', isFavorite }) => {
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

  const favorite = isFavorite !== undefined ? isFavorite : notebook.isFavorite;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
      >
        <Card
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            mb: 1.5,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            },
          }}
          onClick={() => onEdit(notebook)}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookOutlined sx={{ fontSize: 18, color: theme.palette.primary.main }} />
              </Box>

               <Box sx={{ flex: 1, minWidth: 0 }}>
                 <Typography variant="subtitle1" fontWeight={600} noWrap>
                   {notebook.title || 'Untitled'}
                 </Typography>
                 {notebook.collaborators && notebook.collaborators.length > 0 && (
                   <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                     <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.6rem' } }}>
                       {notebook.collaborators.map((collab, i) => (
                         <Tooltip title={`${collab.userId?.name || 'Unknown'} (${collab.userId?.email || ''})`} key={i}>
                           <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                             {(collab.userId?.name || 'U').charAt(0).toUpperCase()}
                           </Avatar>
                         </Tooltip>
                       ))}
                     </AvatarGroup>
                   </Box>
                 )}
                 <Typography variant="body2" color="text.secondary" noWrap>
                   {notebook.content?.replace(/<[^>]+>/g, '').slice(0, 80) || 'No content'}
                 </Typography>
               </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString()}
                </Typography>
                <Tooltip title={favorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(notebook._id);
                    }}
                  >
                    {favorite ? (
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
          </CardContent>
        </Card>

        {/* Context menu for list view */}
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
  }

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
              <Tooltip title={favorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(notebook._id);
                  }}
                >
                  {favorite ? (
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

          {/* Collaborators */}
          {notebook.collaborators && notebook.collaborators.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                {notebook.collaborators.map((collab, i) => (
                  <Tooltip title={`${collab.userId?.name || 'Unknown'} (${collab.userId?.email || ''})`} key={i}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: theme.palette.primary.main }}>
                      {(collab.userId?.name || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}

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

// Skeleton loader - supports both grid and list views
const NotebookCardSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <Card sx={{ borderRadius: 2, mb: 1.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="80%" height={18} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1.5 }} />
              <Skeleton variant="circular" width={28} height={28} />
              <Skeleton variant="circular" width={28} height={28} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }
  return (
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
};

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
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selectedNotebookForShare, setSelectedNotebookForShare] = useState(null);
  const [isUrlSettingsOpen, setIsUrlSettingsOpen] = useState(false);

  const currentUserId = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch { return null; }
  }, []);

  // Fetch notebooks based on current filter with parallel favorites loading
  const fetchNotebooks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth?mode=login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let notebooksResponse;

      // Parallel fetch: notebooks + favorites IDs
      const [nbRes, favRes] = await Promise.allSettled([
        currentFilter === 'favorites'
          ? axios.get(`${config.apiUrl}/api/notebooks/favorites`, { headers })
          : currentFilter === 'shared'
          ? axios.get(`${config.apiUrl}/api/notebooks/shared`, { headers })
          : currentFilter === 'collaborators'
          ? axios.get(`${config.apiUrl}/api/notebooks/shared`, { headers })
          : axios.get(`${config.apiUrl}/api/notebooks`, { headers }),
        axios.get(`${config.apiUrl}/api/notebooks/favorites`, { headers }),
      ]);

      if (nbRes.status === 'fulfilled') {
        notebooksResponse = nbRes.value;
        setNotebooks(notebooksResponse.data.notebooks || []);
      }

      if (favRes.status === 'fulfilled') {
        const favNotebooks = favRes.value.data.notebooks || [];
        setFavoriteIds(new Set(favNotebooks.map(n => n._id)));
      }
    } catch (err) {
      console.error('Error fetching notebooks:', err);
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [navigate, currentFilter]);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  // Filter notebooks by search and optionally by collaborator status
  const filteredNotebooks = useMemo(() => {
    let result = notebooks;

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((nb) =>
        nb.title?.toLowerCase().includes(q) ||
        nb.content?.toLowerCase().includes(q)
      );
    }

    // Apply collaborator filter: notebooks where user is collaborator but not owner
    if (currentFilter === 'collaborators' && currentUserId) {
      result = result.filter((nb) => {
        const isOwner = nb.creatorID?._id === currentUserId || nb.creatorID === currentUserId;
        return !isOwner;
      });
    }

    return result;
  }, [notebooks, searchQuery, currentFilter, currentUserId]);

  const isOwnerOfNotebook = useCallback((notebook) => {
    const creatorId = notebook?.creatorID?._id || notebook?.creatorID;
    return creatorId?.toString() === currentUserId?.toString();
  }, [currentUserId]);

  const handleOpenShareDialog = useCallback((notebook) => {
    setSelectedNotebookForShare(notebook);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setSelectedNotebookForShare(null);
    setIsUrlSettingsOpen(false);
  }, []);

  const handleUrlUpdated = useCallback((nextUrlIdentifier) => {
    if (!selectedNotebookForShare || !nextUrlIdentifier) return;

    setNotebooks((prev) => prev.map((nb) => (
      nb._id === selectedNotebookForShare._id
        ? { ...nb, urlIdentifier: nextUrlIdentifier }
        : nb
    )));

    setSelectedNotebookForShare((prev) => (
      prev ? { ...prev, urlIdentifier: nextUrlIdentifier } : prev
    ));
  }, [selectedNotebookForShare]);

  // Handle create notebook
  const handleCreateNotebook = async (editorMode = 'quill') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/api/notebooks`,
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
      setSnackbar({ open: true, message: apiErrorHandler.getErrorMessage(err), severity: 'error' });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!notebookToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/api/notebooks/${notebookToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotebooks((prev) => prev.filter((nb) => nb._id !== notebookToDelete._id));
      setSnackbar({ open: true, message: 'Notebook deleted', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: apiErrorHandler.getErrorMessage(err), severity: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
    }
  };

  // Toggle favorite via API
  const toggleFavorite = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/api/notebooks/${id}/favorite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.isFavorite) {
        setFavoriteIds((prev) => new Set([...prev, id]));
        setSnackbar({ open: true, message: 'Added to favorites', severity: 'success' });
      } else {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setSnackbar({ open: true, message: 'Removed from favorites', severity: 'info' });
      }

      // Refresh notebooks if viewing favorites
      if (currentFilter === 'favorites') {
        fetchNotebooks();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setSnackbar({ open: true, message: apiErrorHandler.getErrorMessage(err), severity: 'error' });
    }
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
              {currentFilter === 'all' ? 'All' : currentFilter === 'favorites' ? 'Favorites' : currentFilter === 'collaborators' ? 'Collaborators' : 'Shared'}
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
            >
              <MenuItem onClick={() => { setCurrentFilter('all'); setFilterAnchor(null); }}>
                <ListItemIcon><BookOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
                All Notebooks
              </MenuItem>
              <MenuItem onClick={() => { setCurrentFilter('favorites'); setFilterAnchor(null); }}>
                <ListItemIcon><Star sx={{ fontSize: 18, color: theme.palette.warning.main }} /></ListItemIcon>
                Favorites
              </MenuItem>
              <MenuItem onClick={() => { setCurrentFilter('shared'); setFilterAnchor(null); }}>
                <ListItemIcon><People sx={{ fontSize: 18 }} /></ListItemIcon>
                Shared with me
              </MenuItem>
              <MenuItem onClick={() => { setCurrentFilter('collaborators'); setFilterAnchor(null); }}>
                <ListItemIcon><Group sx={{ fontSize: 18, color: theme.palette.info.main }} /></ListItemIcon>
                Collaborators
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

        {/* Notebooks grid or list */}
        {loading ? (
          viewMode === 'list' ? (
            <Box>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <NotebookCardSkeleton key={i} viewMode="list" />
              ))}
            </Box>
          ) : (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <NotebookCardSkeleton viewMode="grid" />
                </Grid>
              ))}
            </Grid>
          )
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
                : currentFilter === 'favorites'
                ? 'Star notebooks to add them to favorites'
                : currentFilter === 'shared'
                ? 'No notebooks have been shared with you yet'
                : currentFilter === 'collaborators'
                ? 'You are not a collaborator on any notebooks yet'
                : 'Create your first notebook to get started'}
            </Typography>
            {!searchQuery && currentFilter === 'all' && (
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
        ) : viewMode === 'list' ? (
          <Box>
            <AnimatePresence>
              {filteredNotebooks.map((notebook, index) => (
                <NotebookCard
                  key={notebook._id}
                  notebook={notebook}
                  onEdit={(nb) => navigate(`/Notebook/${nb.urlIdentifier}`)}
                  onDelete={(nb) => { setNotebookToDelete(nb); setDeleteDialogOpen(true); }}
                  onShare={handleOpenShareDialog}
                  onToggleFavorite={toggleFavorite}
                  index={index}
                  viewMode="list"
                  isFavorite={favoriteIds.has(notebook._id)}
                />
              ))}
            </AnimatePresence>
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
                    onShare={handleOpenShareDialog}
                    onToggleFavorite={toggleFavorite}
                    index={index}
                    viewMode="grid"
                    isFavorite={favoriteIds.has(notebook._id)}
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

      <ShareDialog
        open={Boolean(selectedNotebookForShare)}
        onClose={handleCloseShareDialog}
        notebookId={selectedNotebookForShare?._id || ''}
        notebookTitle={selectedNotebookForShare?.title || 'Untitled Notebook'}
        urlIdentifier={selectedNotebookForShare?.urlIdentifier || ''}
        permissions={selectedNotebookForShare?.permissions || 'everyone'}
        isOwner={isOwnerOfNotebook(selectedNotebookForShare)}
        onOpenUrlSettings={() => setIsUrlSettingsOpen(true)}
        onUrlUpdated={handleUrlUpdated}
      />

      <NotebookUrlSettingsDialog
        open={Boolean(selectedNotebookForShare) && isUrlSettingsOpen}
        onClose={() => setIsUrlSettingsOpen(false)}
        notebookId={selectedNotebookForShare?._id || ''}
        currentUrlIdentifier={selectedNotebookForShare?.urlIdentifier || ''}
        isOwner={isOwnerOfNotebook(selectedNotebookForShare)}
        onUpdated={handleUrlUpdated}
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