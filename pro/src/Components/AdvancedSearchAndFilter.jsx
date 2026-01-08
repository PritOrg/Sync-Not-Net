import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Popover,
  Typography,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  Collapse,
  useTheme,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  DateRange as DateIcon,
  Sort as SortIcon,
  Label as LabelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  BookmarkAdd as BookmarkAddIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosConfig';

const AdvancedSearchAndFilter = ({ onSearch, initialSearchTerm = '', className }) => {
  const theme = useTheme();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState({
    tags: [],
    dateFrom: null,
    dateTo: null,
    sortBy: 'updated', // 'updated', 'created', 'title'
    sortOrder: 'desc', // 'asc', 'desc'
    onlyMine: false,
    onlyShared: false
  });
  
  // UI states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Fetch available tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);
  
  // Fetch all tags from the API
  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await axiosInstance.get('/api/notebooks/tags');
      
      setAvailableTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      if (error.response && error.response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        // Show error message
        const snackbar = document.createElement('div');
        snackbar.style.position = 'fixed';
        snackbar.style.bottom = '20px';
        snackbar.style.left = '50%';
        snackbar.style.transform = 'translateX(-50%)';
        snackbar.style.backgroundColor = '#f44336';
        snackbar.style.color = 'white';
        snackbar.style.padding = '14px';
        snackbar.style.borderRadius = '4px';
        snackbar.textContent = 'Session expired. Please sign in again.';
        document.body.appendChild(snackbar);
        // Redirect after showing message
        setTimeout(() => {
          window.location.href = '/auth?mode=login';
          snackbar.remove();
        }, 2000);
      }
    } finally {
      setTagsLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter button click
  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
    setIsFilterOpen(true);
  };
  
  // Close filter popover
  const handleFilterClose = () => {
    setAnchorEl(null);
    setIsFilterOpen(false);
  };
  
  // Handle tag selection
  const handleTagSelect = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      tags: newValue
    }));
  };
  
  // Handle checkbox filters
  const handleCheckboxChange = (event) => {
    setFilters(prev => ({
      ...prev,
      [event.target.name]: event.target.checked
    }));
  };
  
  // Handle sort option change
  const handleSortChange = (event) => {
    setFilters(prev => ({
      ...prev,
      sortBy: event.target.value
    }));
  };
  
  // Handle sort order change
  const handleSortOrderChange = (event) => {
    setFilters(prev => ({
      ...prev,
      sortOrder: event.target.value
    }));
  };
  
  // Handle date filter changes
  const handleDateFromChange = (date) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: date
    }));
  };
  
  const handleDateToChange = (date) => {
    setFilters(prev => ({
      ...prev,
      dateTo: date
    }));
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      tags: [],
      dateFrom: null,
      dateTo: null,
      sortBy: 'updated',
      sortOrder: 'desc',
      onlyMine: false,
      onlyShared: false
    });
  };
  
  // Execute search with filters
  const handleSearch = () => {
    setLoading(true);
    
    // Prepare search parameters
    const searchParams = {
      query: searchTerm,
      ...filters
    };
    
    // Call the parent component's search handler
    onSearch(searchParams);
    
    // Close filter popover
    handleFilterClose();
    setLoading(false);
  };
  
  // Add a new tag
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setTagsLoading(true);
      await axiosInstance.post('/api/notebooks/tags', { name: newTag.trim() });
      
      // Refresh tags list
      await fetchTags();
      setNewTag('');
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setTagsLoading(false);
    }
  };
  
  // Delete a tag
  const handleDeleteTag = async (tagId) => {
    try {
      setTagsLoading(true);
      await axiosInstance.delete(`/api/notebooks/tags/${tagId}`);
      
      // Refresh tags list
      await fetchTags();
      
      // Remove the tag from current filters if it's selected
      setFilters(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag._id !== tagId)
      }));
    } catch (error) {
      console.error('Error deleting tag:', error);
    } finally {
      setTagsLoading(false);
    }
  };
  
  // Update a tag
  const handleUpdateTag = async (tagId, newName) => {
    try {
      setTagsLoading(true);
      await axiosInstance.put(`/api/notebooks/tags/${tagId}`, { name: newName });
      
      // Refresh tags list
      await fetchTags();
      
      // Update the tag in current filters if it's selected
      setFilters(prev => ({
        ...prev,
        tags: prev.tags.map(tag => 
          tag._id === tagId ? { ...tag, name: newName } : tag
        )
      }));
      
      setSelectedTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
    } finally {
      setTagsLoading(false);
    }
  };
  
  // Apply the Enter key to trigger search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <Box className={className}>
      {/* Search bar with filter button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%'
        }}
      >
        <TextField
          fullWidth
          placeholder="Search notebooks..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => setSearchTerm('')}
                  aria-label="clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper
            }
          }}
        />
        
        <Tooltip title="Filter">
          <Button
            variant="outlined"
            onClick={handleFilterClick}
            startIcon={<FilterIcon />}
            sx={{
              borderRadius: 2,
              height: 40,
              minWidth: 'auto',
              textTransform: 'none',
              borderColor: theme.palette.divider,
              '&:hover': {
                borderColor: theme.palette.primary.main
              }
            }}
          >
            Filters
            {(filters.tags.length > 0 || filters.dateFrom || filters.dateTo || filters.onlyMine || filters.onlyShared) && (
              <Chip 
                label={getActiveFilterCount(filters)}
                size="small" 
                color="primary"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Button>
        </Tooltip>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={loading}
          sx={{
            borderRadius: 2,
            height: 40,
            minWidth: 100,
            textTransform: 'none'
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
        </Button>
        
        <Tooltip title="Manage Tags">
          <IconButton 
            onClick={() => setIsTagManagerOpen(true)}
            sx={{ ml: 0.5 }}
            aria-label="manage tags"
          >
            <LabelIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Filter Popover */}
      <Popover
        open={isFilterOpen}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { 
            width: 320,
            p: 2,
            mt: 0.5
          }
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Filter & Sort
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {/* Tags filter */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Tags
          </Typography>
          <Autocomplete
            multiple
            options={availableTags || []}
            getOptionLabel={(option) => option.name}
            value={filters.tags}
            onChange={handleTagSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder="Select tags..."
                fullWidth
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  sx={{ borderRadius: 1 }}
                />
              ))
            }
            loading={tagsLoading}
            loadingText="Loading tags..."
          />
        </Box>
        
        {/* Date range filter */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Date Range
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Temporary solution until we fix the date picker dependencies */}
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleDateFromChange(date);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleDateToChange(date);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
        
        {/* Sort options */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Sort By
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              row
              name="sortBy"
              value={filters.sortBy}
              onChange={handleSortChange}
            >
              <FormControlLabel 
                value="updated" 
                control={<Radio size="small" />} 
                label="Last Updated" 
              />
              <FormControlLabel 
                value="created" 
                control={<Radio size="small" />} 
                label="Created Date" 
              />
              <FormControlLabel 
                value="title" 
                control={<Radio size="small" />} 
                label="Title" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
        
        {/* Sort order */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Sort Order
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              row
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleSortOrderChange}
            >
              <FormControlLabel 
                value="asc" 
                control={<Radio size="small" />} 
                label="Ascending" 
              />
              <FormControlLabel 
                value="desc" 
                control={<Radio size="small" />} 
                label="Descending" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
        
        {/* Additional filters */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Additional Filters
          </Typography>
          <FormControlLabel
            control={
              <Checkbox 
                checked={filters.onlyMine}
                onChange={handleCheckboxChange}
                name="onlyMine"
                size="small"
              />
            }
            label="Only My Notebooks"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={filters.onlyShared}
                onChange={handleCheckboxChange}
                name="onlyShared"
                size="small"
              />
            }
            label="Only Shared Notebooks"
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="text"
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
            sx={{ textTransform: 'none' }}
          >
            Clear Filters
          </Button>
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ textTransform: 'none' }}
          >
            Apply
          </Button>
        </Box>
      </Popover>
      
      {/* Tag Manager Dialog */}
      <Dialog
        open={isTagManagerOpen}
        onClose={() => {
          setIsTagManagerOpen(false);
          setSelectedTag(null);
          setNewTag('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create, edit or delete tags to organize your notebooks.
          </DialogContentText>
          
          {/* Add new tag */}
          <Box sx={{ display: 'flex', mb: 3, gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="New Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name..."
              disabled={!!selectedTag}
            />
            <Button
              variant="contained"
              onClick={handleAddTag}
              startIcon={<AddIcon />}
              disabled={!newTag.trim() || tagsLoading || !!selectedTag}
            >
              Add
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Edit selected tag */}
          <Collapse in={!!selectedTag}>
            {selectedTag && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Edit Tag
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tag Name"
                    value={selectedTag.name}
                    onChange={(e) => setSelectedTag({ ...selectedTag, name: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateTag(selectedTag._id, selectedTag.name)}
                    disabled={!selectedTag.name.trim() || tagsLoading}
                  >
                    Save
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => setSelectedTag(null)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Collapse>
          
          {/* Tags list */}
          <Typography variant="subtitle2" gutterBottom>
            Existing Tags
          </Typography>
          
          {tagsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : availableTags.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
              No tags created yet.
            </Typography>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              maxHeight: 200,
              overflowY: 'auto',
              p: 1
            }}>
              {availableTags.map((tag) => (
                <Chip
                  key={tag._id}
                  label={tag.name}
                  onDelete={() => handleDeleteTag(tag._id)}
                  onClick={() => setSelectedTag(tag)}
                  deleteIcon={<DeleteIcon />}
                  icon={<LabelIcon />}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsTagManagerOpen(false);
            setSelectedTag(null);
            setNewTag('');
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to count active filters
const getActiveFilterCount = (filters) => {
  let count = 0;
  if (filters.tags.length > 0) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  if (filters.onlyMine) count += 1;
  if (filters.onlyShared) count += 1;
  return count;
};

export default AdvancedSearchAndFilter;