import React, { useState } from 'react';
import { 
  Paper,
  Typography, 
  Box, 
  IconButton, 
  Chip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  alpha,
  useTheme,
  Divider,
  Avatar
} from '@mui/material';
import { 
  FavoriteBorder, 
  Favorite,
  Share, 
  MoreVert,
  Public,
  Lock,
  People,
  Launch,
  Edit,
  AutoAwesome,
  Delete
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const NotebookListItem = ({
  notebook,
  onEdit,
  onEnhancedEdit,
  onDelete,
  onShare,
  onToggleFavorite,
  onClick,
}) => {
  const theme = useTheme();
  const [isFavorited, setIsFavorited] = useState(() => {
    // Check localStorage for favorites
    const favorites = JSON.parse(localStorage.getItem('bookmarked-notebooks') || '[]');
    return favorites.includes(notebook._id);
  });
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Generate a color based on notebook title
  const generateColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      '#38a169', // green
      '#3182ce', // blue
      '#d53f8c', // pink
      '#805ad5', // purple
      '#dd6b20', // orange
    ];
    const charCode = notebook.title?.charCodeAt(0) || 65;
    return colors[charCode % colors.length];
  };

  const handleFavoriteToggle = (e) => {
    // Ensure event doesn't propagate
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent?.stopImmediatePropagation();
    }
    
    const newFavoriteState = !isFavorited;
    setIsFavorited(newFavoriteState);
    
    // Update localStorage
    const favorites = JSON.parse(localStorage.getItem('bookmarked-notebooks') || '[]');
    let newFavorites;
    if (newFavoriteState) {
      newFavorites = [...favorites, notebook._id];
    } else {
      newFavorites = favorites.filter(id => id !== notebook._id);
    }
    localStorage.setItem('bookmarked-notebooks', JSON.stringify(newFavorites));
    
    // Call parent handler if provided
    onToggleFavorite?.(notebook._id, newFavoriteState);
    return false;
  };

  const handleShareClick = (e) => {
    // Ensure event doesn't propagate
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent?.stopImmediatePropagation();
    }
    
    if (navigator.share) {
      navigator.share({
        title: notebook.title || 'Untitled Notebook',
        text: `Check out this notebook: ${notebook.title}`,
        url: `${window.location.origin}/Notebook/${notebook.urlIdentifier}`,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/Notebook/${notebook.urlIdentifier}`)
        .then(() => {
          alert('Link copied to clipboard');
        })
        .catch(console.error);
    }
    onShare?.(notebook);
    return false;
  };

  const handleListItemClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (
      e.target.closest('button') || 
      e.target.closest('.MuiIconButton-root') ||
      e.target.closest('.MuiMenuItem-root') ||
      e.target.closest('[role="button"]') ||
      e.target.closest('.MuiMenu-paper') ||
      e.target.closest('.clickable') ||
      e.defaultPrevented || 
      (e.nativeEvent && e.nativeEvent.defaultPrevented)
    ) {
      return;
    }
    onClick?.(notebook);
  };

  const getTimeAgo = () => {
    const date = new Date(notebook.updatedAt || notebook.createdAt);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Paper
        onClick={handleListItemClick}
        sx={{
          p: 2,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: alpha('#e2e8f0', 0.8),
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
          }
        }}
      >
        <Avatar
          sx={{
            bgcolor: generateColor(),
            width: 40,
            height: 40,
            fontSize: '1rem',
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          {notebook.title?.charAt(0)?.toUpperCase() || 'N'}
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {notebook.title || 'Untitled Notebook'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mr: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {getTimeAgo()}
            </Typography>
            
            {notebook.permissions === 'everyone' && (
              <Public color="primary" sx={{ fontSize: '0.85rem' }} />
            )}
            
            {notebook.requiresPassword && (
              <Lock color="warning" sx={{ fontSize: '0.85rem' }} />
            )}
            
            {notebook.collaborators && notebook.collaborators.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People color="info" sx={{ fontSize: '0.85rem' }} />
                <Typography variant="caption" sx={{ ml: 0.25 }}>
                  {notebook.collaborators.length}
                </Typography>
              </Box>
            )}
            
            {notebook.tags && notebook.tags.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {notebook.tags.slice(0, 2).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      height: 18, 
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                ))}
                {notebook.tags.length > 2 && (
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    +{notebook.tags.length - 2} more
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
          <IconButton 
            size="small"
            onClick={handleFavoriteToggle}
            className="clickable"
            sx={{ color: isFavorited ? 'error.main' : 'text.secondary' }}
          >
            {isFavorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>
          
          <IconButton 
            size="small"
            onClick={handleShareClick}
            className="clickable"
            sx={{ color: 'text.secondary' }}
          >
            <Share fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setMenuAnchor(e.currentTarget);
            }}
            className="clickable"
            sx={{ color: 'text.secondary' }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}
        >
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            onClick?.(notebook);
            setMenuAnchor(null);
          }}>
            <ListItemIcon><Launch fontSize="small" /></ListItemIcon>
            <ListItemText>Open Notebook</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            onEdit?.(notebook);
            setMenuAnchor(null);
          }}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Quick Edit</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            onEnhancedEdit?.(notebook);
            setMenuAnchor(null);
          }}>
            <ListItemIcon><AutoAwesome fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText primary="Enhanced Editor" primaryTypographyProps={{ color: 'primary' }} />
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            handleFavoriteToggle(e);
            setMenuAnchor(null);
          }}>
            <ListItemIcon>
              {isFavorited ? <Favorite fontSize="small" color="error" /> : <FavoriteBorder fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={isFavorited ? "Remove Favorite" : "Add to Favorites"} />
          </MenuItem>
          
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            handleShareClick(e);
            setMenuAnchor(null);
          }}>
            <ListItemIcon><Share fontSize="small" /></ListItemIcon>
            <ListItemText>Share Notebook</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(notebook._id);
              setMenuAnchor(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primary="Delete Notebook" />
          </MenuItem>
        </Menu>
      </Paper>
    </motion.div>
  );
};

export default NotebookListItem;
