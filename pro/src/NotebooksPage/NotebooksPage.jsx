import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress,
  TextField,
  InputAdornment,
  Avatar,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Fade,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Edit, 
  Timer, 
  CalendarMonth, 
  Search, 
  Add, 
  BookOutlined,
  SortOutlined,
  FilterListOutlined,
  MoreVert,
  DeleteOutline,
  ContentCopy,
  Share,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const NotebooksPage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [filteredNotebooks, setFilteredNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [currentMenuNotebook, setCurrentMenuNotebook] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
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

  // Function to strip HTML tags and decode entities
  const stripHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText;
  };

  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/notebooks`, {
          headers: {
            "Authorization": token,
          },
        });
        setNotebooks(response.data);
        setFilteredNotebooks(response.data);
        setLoading(false);
        
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('favorite-notebooks');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('Error fetching notebooks:', error);
        setLoading(false);
      }
    };
    fetchNotebooks();
  }, []);
  
  // Apply search filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotebooks(notebooks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = notebooks.filter(notebook => 
        notebook.title?.toLowerCase().includes(query) || 
        stripHtml(notebook.content)?.toLowerCase().includes(query)
      );
      setFilteredNotebooks(filtered);
    }
  }, [searchQuery, notebooks]);
  
  // Apply tab filtering
  useEffect(() => {
    let filtered = [...notebooks];
    
    // Apply search first
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notebook => 
        notebook.title?.toLowerCase().includes(query) || 
        stripHtml(notebook.content)?.toLowerCase().includes(query)
      );
    }
    
    // Then apply tab filter
    if (tabValue === 1) { // Favorites tab
      filtered = filtered.filter(notebook => favorites.includes(notebook._id));
    }
    
    // Then apply sorting
    filtered = applySorting(filtered, currentSort.id);
    
    setFilteredNotebooks(filtered);
  }, [tabValue, notebooks, searchQuery, favorites, currentSort]);
  
  const applySorting = (notebooksToSort, sortId) => {
    const sorted = [...notebooksToSort];
    
    switch(sortId) {
      case 'updated-desc':
        return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      case 'updated-asc':
        return sorted.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
      case 'created-desc':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'created-asc':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'title-asc':
        return sorted.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
      case 'title-desc':
        return sorted.sort((a, b) => (b.title || 'Untitled').localeCompare(a.title || 'Untitled'));
      default:
        return sorted;
    }
  };

  const handleNotebookClick = (urlIdentifier) => {
    navigate('/Notebook/' + urlIdentifier);
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
  
  const handleSortSelect = (sortOption) => {
    setCurrentSort(sortOption);
    handleSortClose();
  };
  
  const handleMenuOpen = (event, notebook) => {
    event.stopPropagation();
    setCurrentMenuNotebook(notebook);
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const toggleFavorite = (event, notebookId) => {
    event.stopPropagation();
    
    let newFavorites;
    if (favorites.includes(notebookId)) {
      newFavorites = favorites.filter(id => id !== notebookId);
    } else {
      newFavorites = [...favorites, notebookId];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favorite-notebooks', JSON.stringify(newFavorites));
  };
  
  const getRandomColor = (text) => {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    
    const hash = text.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 }, backgroundColor: '#f9fafc', minHeight: '100vh' }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)',
        borderRadius: 3,
        padding: { xs: 3, sm: 4 },
        mb: 4,
        color: 'white',
        boxShadow: '0 8px 32px rgba(107, 70, 193, 0.2)'
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            mb: 1
          }}
        >
          Your Notebooks
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 3, maxWidth: '600px' }}>
          Capture your thoughts, ideas, and research in one place. Create, organize, and access your notebooks anytime.
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search your notebooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              maxWidth: '500px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'transparent',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent',
                },
              },
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
          
          <Button 
            variant="contained"
            onClick={() => navigate('/Notebook/new')}
            startIcon={<Add />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              background: 'white',
              color: '#6B46C1',
              fontWeight: 600,
              padding: '10px 20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)',
              }
            }}
          >
            Create New Notebook
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#6B46C1',
              },
            }}
          >
            <Tab 
              label="All Notebooks" 
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                '&.Mui-selected': { color: '#6B46C1' }
              }} 
            />
            <Tab 
              label="Favorites" 
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                '&.Mui-selected': { color: '#6B46C1' }
              }} 
            />
          </Tabs>
          
          <Box>
            <Button
              startIcon={<SortOutlined />}
              onClick={handleSortClick}
              sx={{ 
                textTransform: 'none',
                color: 'text.secondary',
              }}
            >
              {!isMobile && currentSort.label}
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
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
        
        <Divider />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress sx={{ color: '#6B46C1' }} />
        </Box>
      ) : filteredNotebooks.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '300px',
          padding: 4,
          textAlign: 'center'
        }}>
          <BookOutlined sx={{ fontSize: 80, color: '#E2E8F0', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery.trim() !== '' ? 'No notebooks match your search' : tabValue === 1 ? 'No favorite notebooks yet' : 'No notebooks found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: '400px' }}>
            {searchQuery.trim() !== '' ? 
              'Try using different keywords or browse all your notebooks' : 
              tabValue === 1 ? 
                'Click the heart icon on any notebook to add it to your favorites' : 
                'Start creating notebooks to capture your ideas and notes'
            }
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/Notebook/new')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)',
              fontWeight: 600,
              padding: '10px 20px',
              boxShadow: '0 4px 12px rgba(107, 70, 193, 0.2)',
            }}
          >
            Create Your First Notebook
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredNotebooks.map((notebook) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={notebook._id}>
              <Card
                onClick={() => handleNotebookClick(notebook.urlIdentifier)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                <Box 
                  sx={{ 
                    height: 8, 
                    background: getRandomColor(notebook._id),
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                  }} 
                />
                
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        flex: 1
                      }}
                    >
                      {notebook.title || 'Untitled Notebook'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => toggleFavorite(e, notebook._id)}
                        sx={{ color: favorites.includes(notebook._id) ? '#F56565' : 'text.secondary' }}
                      >
                        {favorites.includes(notebook._id) ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                      
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleMenuOpen(e, notebook)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {stripHtml(notebook.content) || 'No content available'}
                  </Typography>

                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth fontSize="small" sx={{ color: 'rgba(0, 0, 0, 0.4)' }} />
                      <Typography variant="caption" color="text.secondary">
                        Created: {format(new Date(notebook.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timer fontSize="small" sx={{ color: 'rgba(0, 0, 0, 0.4)' }} />
                      <Typography variant="caption" color="text.secondary">
                        Updated: {formatDistanceToNow(new Date(notebook.updatedAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Share fontSize="small" sx={{ mr: 1 }} /> Share
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteOutline fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotebooksPage;