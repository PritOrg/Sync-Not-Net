import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Chip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Tooltip,
  alpha,
  useTheme,
  Divider
} from '@mui/material';
import { 
  FavoriteBorder, 
  Favorite,
  Share, 
  MoreVert, 
  Schedule,
  Public,
  Lock,
  People,
  Launch,
  Edit,
  AutoAwesome,
  Delete
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';

const NotebookCard = ({
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

  const handleCardClick = (e) => {
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

  const getContentPreview = () => {
    if (!notebook.content) return 'No content yet...';
    
    // Remove HTML tags for clean preview
    const cleanContent = notebook.content.replace(/<[^>]*>/g, '').trim();
    return cleanContent.length > 150 
      ? cleanContent.substring(0, 150) + '...' 
      : cleanContent;
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        onClick={handleCardClick}
        sx={{
          height: 320,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: alpha('#e2e8f0', 0.8),
          borderRadius: 2,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with title and menu */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: alpha('#e2e8f0', 0.6),
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: 'calc(100% - 40px)' }}>
            <Avatar
              sx={{
                bgcolor: generateColor(),
                width: 36,
                height: 36,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {notebook.title?.charAt(0)?.toUpperCase() || 'N'}
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}
            >
              {notebook.title || 'Untitled Notebook'}
            </Typography>
          </Box>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setMenuAnchor(e.currentTarget);
            }}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {/* Content preview */}
        <CardContent sx={{ flex: 1, pt: 1.5, pb: 1, px: 2, overflow: 'hidden' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              mb: 2,
              fontSize: '0.875rem',
            }}
          >
            {getContentPreview()}
          </Typography>
          
          {/* Tags */}
          {notebook.tags && notebook.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {notebook.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    height: 20, 
                    fontSize: '0.675rem',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
              {notebook.tags.length > 3 && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  +{notebook.tags.length - 3} more
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        {/* Footer with metadata and actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1.5,
            pt: 1,
            borderTop: '1px solid',
            borderColor: alpha('#e2e8f0', 0.6),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              size="small"
              icon={<Schedule sx={{ fontSize: '0.75rem' }} />}
              label={getTimeAgo()}
              sx={{ 
                height: 24,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.text.primary,
                fontSize: '0.7rem',
                '& .MuiChip-icon': { color: theme.palette.text.secondary },
              }}
            />
            
            {notebook.permissions === 'everyone' && (
              <Tooltip title="Public notebook">
                <Public color="primary" sx={{ fontSize: '1rem' }} />
              </Tooltip>
            )}
            
            {notebook.requiresPassword && (
              <Tooltip title="Password protected">
                <Lock color="warning" sx={{ fontSize: '1rem' }} />
              </Tooltip>
            )}
            
            {notebook.collaborators && notebook.collaborators.length > 0 && (
              <Tooltip title={`${notebook.collaborators.length} collaborator${notebook.collaborators.length !== 1 ? 's' : ''}`}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People color="info" sx={{ fontSize: '1rem' }} />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {notebook.collaborators.length}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
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
          </Box>
        </Box>
      </Card>

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
    </motion.div>
  );
};

export default NotebookCard;
