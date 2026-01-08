import React, { useState, useCallback } from 'react';
import {
  Box,
  Chip,
  TextField,
  Autocomplete,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { Tag as TagIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const TagsInput = ({ value = [], onChange, disabled = false }) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced function to fetch tag suggestions
  const fetchSuggestions = useCallback(async (searchText) => {
    if (!searchText) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tags/search?q=${searchText}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(response.data.tags);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    if (newInputValue) {
      fetchSuggestions(newInputValue);
    }
  };

  const handleTagAdd = (event, newValue) => {
    if (newValue && !value.includes(newValue)) {
      onChange([...value, newValue]);
    }
  };

  const handleTagDelete = (tagToDelete) => {
    onChange(value.filter(tag => tag !== tagToDelete));
  };

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      value={value}
      onChange={handleTagAdd}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={suggestions}
      getOptionLabel={(option) => option}
      filterOptions={(x) => x}
      freeSolo
      renderTags={(value, getTagProps) =>
        value.map((tag, index) => (
          <Chip
            {...getTagProps({ index })}
            key={tag}
            label={tag}
            onDelete={disabled ? undefined : handleTagDelete}
            icon={<TagIcon fontSize="small" />}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '4px',
              '& .MuiChip-deleteIcon': {
                color: theme.palette.primary.main,
              },
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={disabled ? '' : 'Add tags...'}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading && <CircularProgress size={20} />}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};

export default TagsInput;