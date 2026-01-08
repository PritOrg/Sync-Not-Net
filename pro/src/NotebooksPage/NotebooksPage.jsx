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
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  IconButton,
  Container,
  Alert,
  Snackbar,
  Pagination,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Add,
  BookOutlined,
  SortOutlined,
  ViewModule,
  ViewList,
  Refresh,
  ArrowDropDown,
  AutoAwesome,
  Create,
  Label as LabelIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { NotebookCard, NotebookListItem } from '../Components/NotebookCard';
import { ModernActionButton } from '../Components/ModernUI';
import { NotebookCardSkeleton } from '../Components/LoadingStates';
import { InlineErrorFallback } from '../Components/ErrorBoundary';
import DeleteNotebookDialog from '../Components/DeleteNotebookDialog';
import AdvancedSearchAndFilter from '../Components/AdvancedSearchAndFilter';

import axiosInstance from '../utils/axiosConfig';

const NotebooksPage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [filteredNotebooks, setFilteredNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Advanced search state
  const [searchParams, setSearchParams] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const sortOptions = [
    { id: 'updated-desc', label: 'Recently Updated' },
    { id: 'updated-asc', label: 'Oldest Updated' },
    { id: 'created-desc', label: 'Recently Created' },
    { id: 'created-asc', label: 'Oldest Created' },
    { id: 'title-asc', label: 'Title A-Z' },
    { id: 'title-desc', label: 'Title Z-A' }
  ];
  
  const [currentSort, setCurrentSort] = useState(sortOptions[0]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotebooks, setTotalNotebooks] = useState(0);
  const [itemsPerPage] = useState(10);



  const fetchNotebooks = useCallback(async (currentFavorites = [], page = 1, advancedSearchParams = null) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please sign in to view notebooks',
          severity: 'warning'
        });
        setTimeout(() => navigate('/auth?mode=login'), 2000);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      // Use advanced search params if provided, otherwise use simple search
      if (advancedSearchParams) {
        if (advancedSearchParams.query) {
          params.append('query', advancedSearchParams.query);
        }
        
        // Add tag filters
        if (advancedSearchParams.tags && advancedSearchParams.tags.length > 0) {
          const tagIds = advancedSearchParams.tags.map(tag => tag._id).join(',');
          params.append('tags', tagIds);
        }
        
        // Add date filters
        if (advancedSearchParams.dateFrom) {
          params.append('dateFrom', advancedSearchParams.dateFrom.toISOString());
        }
        
        if (advancedSearchParams.dateTo) {
          params.append('dateTo', advancedSearchParams.dateTo.toISOString());
        }
        
        // Add sort options
        if (advancedSearchParams.sortBy) {
          params.append('sortBy', advancedSearchParams.sortBy);
        }
        
        if (advancedSearchParams.sortOrder) {
          params.append('sortOrder', advancedSearchParams.sortOrder);
        }
        
        // Add additional filters
        if (advancedSearchParams.onlyMine) {
          params.append('onlyMine', 'true');
        }
        
        if (advancedSearchParams.onlyShared) {
          params.append('onlyShared', 'true');
        }
      } else if (searchQuery.trim()) {
        // Simple search if no advanced params but search query exists
        params.append('query', searchQuery.trim());
      }

      const response = await axiosInstance.get(`/api/notebooks/search?${params.toString()}`);

      const notebooksData = response.data.notebooks || [];
      const paginationData = response.data.pagination || {};

      const notebooksWithFavorites = notebooksData.map(notebook => ({
        ...notebook,
        isFavorited: currentFavorites.includes(notebook._id)
      }));

      setNotebooks(notebooksWithFavorites);
      setCurrentPage(paginationData.page || 1);
      setTotalPages(paginationData.pages || 1);
      setTotalNotebooks(paginationData.total || 0);
      setFilteredNotebooks(notebooksWithFavorites);
    } catch (error) {
      console.error('Error fetching notebooks:', error);

      let errorMessage = 'Failed to load notebooks';
      let snackbarMessage = 'Failed to load notebooks. Please try again.';

      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        switch (status) {
          case 401:
            errorMessage = 'Authentication expired. Please sign in again.';
            snackbarMessage = 'Session expired. Redirecting to login...';
            localStorage.removeItem('token'); // Clear invalid token
            setSnackbar({
              open: true,
              message: snackbarMessage,
              severity: 'warning'
            });
            setTimeout(() => navigate('/auth?mode=login'), 2000);
            break;
          case 403:
            errorMessage = 'Access denied. You don\'t have permission to view notebooks.';
            snackbarMessage = 'Access denied. Please contact support.';
            break;
          case 404:
            errorMessage = 'Notebooks service not found.';
            snackbarMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment.';
            snackbarMessage = 'Too many requests. Please wait before trying again.';
            break;
          case 500:
            errorMessage = 'Server error occurred while loading notebooks.';
            snackbarMessage = 'Server error. Please try again in a few minutes.';
            break;
          default:
            errorMessage = serverMessage || `Error ${status}: Failed to load notebooks`;
            snackbarMessage = serverMessage || 'An unexpected error occurred. Please try again.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
        snackbarMessage = 'Network error. Please check your internet connection.';
      }

      setError(errorMessage);
      setSnackbar({
        open: true,
        message: snackbarMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, itemsPerPage]);

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth?mode=login');
      return;
    }

    // Validate token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp <= currentTime) {
        // Token is expired
        localStorage.removeItem('token');
        navigate('/auth?mode=login');
        return;
      }
    } catch (error) {
      // Invalid token format
      localStorage.removeItem('token');
      navigate('/auth?mode=login');
      return;
    }

    // Load favorites from localStorage and fetch notebooks only once
    const savedFavorites = localStorage.getItem('favorite-notebooks');
    const currentFavorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    setFavorites(currentFavorites);

    // Fetch notebooks with current favorites
    fetchNotebooks(currentFavorites, currentPage, searchQuery, getSortField(currentSort.id), getSortOrder(currentSort.id));
  }, [fetchNotebooks, navigate, currentPage, searchQuery, currentSort]);

  // Helper functions to convert sort option to API parameters
  const getSortField = (sortId) => {
    if (sortId.includes('title')) return 'title';
    if (sortId.includes('created')) return 'createdAt';
    return 'updatedAt';
  };

  const getSortOrder = (sortId) => {
    return sortId.includes('asc') ? 'asc' : 'desc';
  };
  
  // Apply tab filtering (favorites only, since backend handles search and sorting)
  useEffect(() => {
    let filtered = [...notebooks];

    // Apply favorites tab filter
    if (tabValue === 1) { // Favorites tab
      filtered = filtered.filter(notebook => favorites.includes(notebook._id));
    }

    setFilteredNotebooks(filtered);
  }, [tabValue, notebooks, favorites]);

  // Pagination handlers
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  // Search handler with debouncing
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Advanced search handler
  const handleAdvancedSearch = (searchParams) => {
    setSearchParams(searchParams);
    setCurrentPage(1); // Reset to first page when searching with advanced filters
    
    // Call fetch notebooks with the advanced search parameters
    fetchNotebooks(favorites, 1, searchParams);
  };

  // Sort handler
  const handleSortSelect = (sortOption) => {
    setCurrentSort(sortOption);
    setCurrentPage(1); // Reset to first page when sorting
    handleSortClose();
  };


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  // Modern notebook action handlers
  const handleNotebookOpen = (notebook) => {
    navigate('/Notebook/' + notebook.urlIdentifier);
  };

  const handleEnhancedEdit = (notebook) => {
    navigate(`/Notebook/${notebook.urlIdentifier}/enhanced`);
  };

  const handleToggleFavorite = (notebookId, isFavorited) => {
    let updatedFavorites;
    if (isFavorited) {
      updatedFavorites = [...favorites, notebookId];
    } else {
      updatedFavorites = favorites.filter(id => id !== notebookId);
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favorite-notebooks', JSON.stringify(updatedFavorites));

    // Update notebooks state
    setNotebooks(prev => prev.map(notebook =>
      notebook._id === notebookId
        ? { ...notebook, isFavorited }
        : notebook
    ));

    setSnackbar({
      open: true,
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites',
      severity: 'success'
    });
  };

  const handleShareNotebook = (notebook) => {
    const shareUrl = `${window.location.origin}/Notebook/${notebook.urlIdentifier}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSnackbar({
        open: true,
        message: 'Share link copied to clipboard!',
        severity: 'success'
      });
    }).catch(() => {
      setSnackbar({
        open: true,
        message: 'Failed to copy link',
        severity: 'error'
      });
    });
  };

  const handleOpenDeleteDialog = (notebook) => {
    setNotebookToDelete(notebook);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    // Clear the notebook to delete after a delay to avoid UI flicker
    setTimeout(() => setNotebookToDelete(null), 300);
  };

  const handleConfirmDelete = async () => {
    if (!notebookToDelete) return;

      setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/notebooks/${notebookToDelete._id}`);

      // Update the notebooks state to remove the deleted notebook
      setNotebooks(prev => prev.filter(notebook => notebook._id !== notebookToDelete._id));
            setSnackbar({
        open: true,
        message: 'Notebook deleted successfully',
        severity: 'success'
      });
      
      // Close the dialog
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting notebook:', error);

      let message = 'Failed to delete notebook';

      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        switch (status) {
          case 401:
            message = 'Authentication expired. Please sign in again.';
            setTimeout(() => navigate('/auth?mode=login'), 2000);
            break;
          case 403:
            message = 'You don\'t have permission to delete this notebook.';
            break;
          case 404:
            message = 'Notebook not found. It may have already been deleted.';
            // Refresh the list to remove the notebook from UI
            fetchNotebooks();
            break;
          case 409:
            message = 'Cannot delete notebook. It may be shared with others.';
            break;
          default:
            message = serverMessage || `Error ${status}: Failed to delete notebook`;
        }
      } else if (error.request) {
        message = 'Network error. Please check your connection and try again.';
      }

      setSnackbar({
        open: true,
        message,
        severity: 'error'
      });
    }
  };

  const handleCreateNotebook = () => {
    navigate('/create-notebook');
  };

  const handleCreateEnhancedNotebook = () => {
    navigate('/create-enhanced');
  };

  const handleRefresh = () => {
    const savedFavorites = localStorage.getItem('favorite-notebooks');
    const currentFavorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    fetchNotebooks(currentFavorites, currentPage, searchQuery, getSortField(currentSort.id), getSortOrder(currentSort.id));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  


  // Error fallback component
  if (error && !loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <InlineErrorFallback
          error={error}
          onRetry={handleRefresh}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          mb: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              pointerEvents: 'none'
            }}
          />

          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Your Notebooks
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, maxWidth: '600px' }}>
            Capture your thoughts, ideas, and research in one place. Create, organize, and access your notebooks anytime.
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <AdvancedSearchAndFilter 
              initialSearchTerm={searchQuery}
              onSearch={handleAdvancedSearch}
              className="search-component"
              sx={{
                maxWidth: '100%',
                flex: 1,
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'white' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ position: 'relative' }}>
              <ModernActionButton
                variant="contained"
                onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
                endIcon={<ArrowDropDown />}
                startIcon={<Add />}
                sx={{
                  background: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              >
                {isMobile ? 'New' : 'Create Notebook'}
              </ModernActionButton>
              
              <Menu
                anchorEl={createMenuAnchor}
                open={Boolean(createMenuAnchor)}
                onClose={() => setCreateMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    '& .MuiMenuItem-root': {
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                    }
                  }
                }}
              >
                <MenuItem onClick={() => {
                  handleCreateNotebook();
                  setCreateMenuAnchor(null);
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Create fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">Quick Create</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Basic notebook creation
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem onClick={() => {
                  handleCreateEnhancedNotebook();
                  setCreateMenuAnchor(null);
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        Enhanced Creator
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Advanced creation with templates
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Helpful Tips Banner */}
      {!loading && notebooks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 2,
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              borderLeft: `4px solid ${theme.palette.info.main}`,
              '& .MuiAlert-icon': {
                color: theme.palette.info.main
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              🎯 Quick Tips for Better Productivity
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              • Use <strong>Ctrl+S</strong> to save quickly • Toggle <strong>Auto-Save</strong> to never lose work • 
              Try <strong>Rich Text</strong> for notes, <strong>Code Mode</strong> for programming • 
              Share with custom permissions and passwords for security
            </Typography>
          </Alert>
        </motion.div>
      )}

      {/* Controls Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          >
            <Tab
              label={`All Notebooks (${notebooks.length})`}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: theme.palette.primary.main }
              }}
            />
            <Tab
              label={`Favorites (${favorites.length})`}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: theme.palette.primary.main }
              }}
            />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              sx={{ color: 'text.secondary' }}
            >
              {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
            </IconButton>

            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              sx={{ color: 'text.secondary' }}
            >
              <Refresh />
            </IconButton>

            <Button
              startIcon={<SortOutlined />}
              onClick={handleSortClick}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              {!isMobile && currentSort.label}
            </Button>

            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.id}
                  onClick={() => handleSortSelect(option)}
                  selected={currentSort.id === option.id}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </motion.div>

      {/* Content Section */}
      {loading ? (
        <NotebookCardSkeleton count={6} />
      ) : filteredNotebooks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            p: 4,
            textAlign: 'center'
          }}>
            <BookOutlined sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              {searchQuery.trim() !== '' ? 'No notebooks match your search' :
               tabValue === 1 ? 'No favorite notebooks yet' : 'No notebooks found'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '400px' }}>
              {searchQuery.trim() !== '' ?
                'Try using different keywords or browse all your notebooks' :
                tabValue === 1 ?
                  'Click the heart icon on any notebook to add it to your favorites' :
                  'Start creating notebooks to capture your ideas and notes. Switch between rich text and code modes, collaborate in real-time!'
              }
            </Typography>

            {searchQuery.trim() === '' && tabValue !== 1 && (
              <>
                <ModernActionButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateNotebook}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    mb: 2
                  }}
                >
                  Create Your First Notebook
                </ModernActionButton>
                
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  💡 Pro tip: Use rich text for documentation, code mode for programming. 
                  Alt+Shift+F formats code automatically!
                </Typography>
              </>
            )}
          </Box>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Grid container spacing={3}>
            <AnimatePresence>
              {filteredNotebooks.map((notebook, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={notebook._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 100
                    }}
                  >
                    {viewMode === 'grid' ? (
                      <NotebookCard
                        notebook={notebook}
                        onClick={handleNotebookOpen}
                        onEdit={handleNotebookOpen}
                        onEnhancedEdit={handleEnhancedEdit}
                        onToggleFavorite={handleToggleFavorite}
                        onShare={handleShareNotebook}
                        onDelete={() => handleOpenDeleteDialog(notebook)}
                      />
                    ) : (
                      <NotebookListItem
                        notebook={notebook}
                        onClick={handleNotebookOpen}
                        onEdit={handleNotebookOpen}
                        onEnhancedEdit={handleEnhancedEdit}
                        onToggleFavorite={handleToggleFavorite}
                        onShare={handleShareNotebook}
                        onDelete={() => handleOpenDeleteDialog(notebook)}
                      />
                    )}
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && filteredNotebooks.length > 0 && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 4,
            mb: 2,
            gap: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalNotebooks)} of {totalNotebooks} notebooks
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? "small" : "medium"}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                },
                '& .MuiPaginationItem-page.Mui-selected': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  }
                }
              }}
            />
          </Box>
        </motion.div>
      )}

      {/* Delete Notebook Dialog */}
      <DeleteNotebookDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        notebookTitle={notebookToDelete?.title || 'this notebook'}
        isDeleting={isDeleting}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotebooksPage;