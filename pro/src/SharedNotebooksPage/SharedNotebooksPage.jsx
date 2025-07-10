import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Container,
  Chip,
  Avatar,
  IconButton,
  InputAdornment,
  TextField,
  Pagination,
  CircularProgress,
  Alert,
  Fade,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Launch as LaunchIcon,
  Share as ShareIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const SharedNotebooksPage = () => {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchSharedNotebooks = async (currentPage = 1, search = '') => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notebooks/shared?page=${currentPage}&limit=12&search=${encodeURIComponent(search)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch shared notebooks');
      }

      const data = await response.json();
      setNotebooks(data.notebooks);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
      setError(null);
    } catch (error) {
      console.error('Error fetching shared notebooks:', error);
      setError('Failed to load shared notebooks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedNotebooks(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  };

  if (loading && notebooks.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Shared with Me
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Notebooks where you've been added as a collaborator
        </Typography>

        {/* Search */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <TextField
            fullWidth
            placeholder="Search shared notebooks..."
            value={searchQuery}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'white',
                borderRadius: 2,
                '& fieldset': { border: 'none' },
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }
            }}
          />
        </Paper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results Summary */}
      {!loading && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={<FolderIcon />}
            label={`${total} shared notebook${total !== 1 ? 's' : ''}`}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
          {searchQuery && (
            <Typography variant="body2" color="text.secondary">
              Searching for "{searchQuery}"
            </Typography>
          )}
        </Box>
      )}

      {/* Notebooks Grid */}
      {notebooks.length > 0 ? (
        <Fade in={!loading}>
          <Grid container spacing={3}>
            {notebooks.map((notebook) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={notebook._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Title */}
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3
                      }}
                    >
                      {notebook.title || 'Untitled Notebook'}
                    </Typography>

                    {/* Creator Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          mr: 1, 
                          fontSize: '0.75rem',
                          bgcolor: 'primary.main'
                        }}
                      >
                        {getInitials(notebook.creatorID?.name)}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        by {notebook.creatorID?.name || 'Unknown'}
                      </Typography>
                    </Box>

                    {/* Tags */}
                    {notebook.tags && notebook.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {notebook.tags.slice(0, 2).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 22,
                              borderRadius: 1
                            }}
                          />
                        ))}
                        {notebook.tags.length > 2 && (
                          <Chip
                            label={`+${notebook.tags.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 22,
                              borderRadius: 1
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Last Updated */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notebook.updatedAt)}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/notebook/${notebook.urlIdentifier}`)}
                      startIcon={<LaunchIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1
                      }}
                    >
                      Open Notebook
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      ) : !loading ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            bgcolor: 'grey.50', 
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <ShareIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? 'No notebooks found' : 'No shared notebooks yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'When someone shares a notebook with you, it will appear here'
            }
          </Typography>
        </Paper>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>
      )}

      {/* Loading overlay for search */}
      {loading && notebooks.length > 0 && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            bgcolor: 'rgba(255,255,255,0.8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default SharedNotebooksPage;
