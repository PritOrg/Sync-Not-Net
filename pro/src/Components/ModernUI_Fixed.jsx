import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  MoreVert,
  Launch,
  Edit,
  Delete,
  AutoAwesome,
  Schedule,
  Public,
  Lock,
  People,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

// Ultra-Modern Notebook Card with Next-Gen Design
export const UltraModernNotebookCard = ({
  notebook,
  onEdit,
  onEnhancedEdit,
  onDelete,
  onShare,
  onToggleFavorite,
  onClick,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(() => {
    // Check localStorage for favorites
    const favorites = JSON.parse(localStorage.getItem('bookmarked-notebooks') || '[]');
    return favorites.includes(notebook._id);
  });
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Generate a sophisticated gradient palette based on the notebook title
  const generateGradient = () => {
    const premiumGradients = [
      ['#6366f1', '#8b5cf6', '#a855f7'], // Purple spectrum
      ['#06b6d4', '#3b82f6', '#6366f1'], // Blue spectrum
      ['#10b981', '#059669', '#047857'], // Green spectrum
      ['#f59e0b', '#ef4444', '#dc2626'], // Warm spectrum
      ['#ec4899', '#be185d', '#be123c'], // Pink spectrum
      ['#8b5cf6', '#7c3aed', '#6d28d9'], // Violet spectrum
      ['#0ea5e9', '#0284c7', '#0369a1'], // Sky spectrum
      ['#f97316', '#ea580c', '#dc2626'], // Orange spectrum
    ];
    const colorIndex = (notebook.title?.charCodeAt(0) || 65) % premiumGradients.length;
    const gradient = premiumGradients[colorIndex];
    return `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 50%, ${gradient[2]} 100%)`;
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
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
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: notebook.title || 'Untitled Notebook',
        text: `Check out this notebook: ${notebook.title}`,
        url: `${window.location.origin}/Notebook/${notebook.urlIdentifier}`,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/Notebook/${notebook.urlIdentifier}`)
        .then(() => {
          console.log('Link copied to clipboard');
        })
        .catch(console.error);
    }
    onShare?.(notebook);
  };

  const getTimeAgo = () => {
    const date = new Date(notebook.updatedAt || notebook.createdAt);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getContentPreview = () => {
    const cleanContent = notebook.content?.replace(/<[^>]*>/g, '').trim() || '';
    return cleanContent.length > 120 ? cleanContent.substring(0, 120) + '...' : cleanContent || 'No content yet...';
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        onClick={() => onClick?.(notebook)}
        sx={{
          height: 360,
          cursor: 'pointer',
          position: 'relative',
          background: `
            linear-gradient(145deg, 
              ${alpha('#ffffff', 0.95)} 0%,
              ${alpha('#f8fafc', 0.90)} 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          border: `1px solid ${alpha('#e2e8f0', 0.3)}`,
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          '&:hover': {
            boxShadow: `
              0 20px 40px ${alpha(theme.palette.primary.main, 0.12)},
              0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)},
              inset 0 1px 0 ${alpha('#ffffff', 0.8)}
            `,
            borderColor: alpha(theme.palette.primary.main, 0.15),
            background: `
              linear-gradient(145deg, 
                ${alpha('#ffffff', 0.98)} 0%,
                ${alpha('#f8fafc', 0.95)} 100%
              )
            `,
          },
        }}
      >
        {/* Enhanced Gradient Header */}
        <Box
          sx={{
            height: 100,
            background: generateGradient(),
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)
              `,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isHovered 
                ? 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)'
                : 'none',
              transition: 'all 0.3s ease',
            },
          }}
        >
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px)',
                border: '3px solid rgba(255, 255, 255, 0.4)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'white',
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`,
              }}
            >
              {notebook.title?.charAt(0)?.toUpperCase() || 'N'}
            </Avatar>
          </motion.div>

          {/* Quick Actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton
                      size="small"
                      onClick={handleFavoriteToggle}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(20px)',
                        color: isFavorited ? '#ff6b6b' : 'white',
                        border: `1px solid rgba(255, 255, 255, 0.3)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.35)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {isFavorited ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Share notebook">
                    <IconButton
                      size="small"
                      onClick={handleShareClick}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(20px)',
                        color: 'white',
                        border: `1px solid rgba(255, 255, 255, 0.3)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.35)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="More options">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAnchor(e.currentTarget);
                      }}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(20px)',
                        color: 'white',
                        border: `1px solid rgba(255, 255, 255, 0.3)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.35)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <CardContent sx={{ 
          p: 3, 
          height: 'calc(100% - 100px)', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* Enhanced Title and Metadata */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                lineHeight: 1.3,
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: theme.palette.text.primary,
              }}
            >
              {notebook.title || 'Untitled Notebook'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={getTimeAgo()}
                icon={<Schedule sx={{ fontSize: '0.8rem' }} />}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-icon': { color: theme.palette.primary.main }
                }}
              />
              
              {notebook.creatorID?.name && (
                <Chip
                  size="small"
                  avatar={
                    <Avatar sx={{ 
                      width: 18, 
                      height: 18, 
                      fontSize: '0.6rem', 
                      bgcolor: alpha(theme.palette.text.secondary, 0.15),
                      color: theme.palette.text.secondary
                    }}>
                      {notebook.creatorID.name.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={notebook.creatorID.name}
                  sx={{
                    backgroundColor: alpha(theme.palette.text.secondary, 0.06),
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Content Preview */}
          <Box sx={{ flex: 1, mb: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                fontSize: '0.875rem',
              }}
            >
              {getContentPreview()}
            </Typography>
          </Box>

          {/* Status Badges */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {notebook.permissions === 'public' && (
              <Chip
                size="small"
                icon={<Public sx={{ fontSize: '0.8rem' }} />}
                label="Public"
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
            {notebook.requiresPassword && (
              <Chip
                size="small"
                icon={<Lock sx={{ fontSize: '0.8rem' }} />}
                label="Protected"
                color="warning"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
            {notebook.collaborators && notebook.collaborators.length > 0 && (
              <Chip
                size="small"
                icon={<People sx={{ fontSize: '0.8rem' }} />}
                label={`${notebook.collaborators.length} collaborator${notebook.collaborators.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>

          {/* Footer Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Open notebook">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(notebook);
                  }}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <Launch sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              
              {!isHovered && (
                <>
                  <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton 
                      size="small" 
                      onClick={handleFavoriteToggle}
                      sx={{
                        color: isFavorited ? '#ff6b6b' : theme.palette.text.secondary,
                        '&:hover': { 
                          bgcolor: isFavorited 
                            ? alpha('#ff6b6b', 0.08) 
                            : alpha(theme.palette.text.secondary, 0.08) 
                        }
                      }}
                    >
                      {isFavorited ? <Favorite sx={{ fontSize: '1rem' }} /> : <FavoriteBorder sx={{ fontSize: '1rem' }} />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Share notebook">
                    <IconButton 
                      size="small" 
                      onClick={handleShareClick}
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.08) }
                      }}
                    >
                      <Share sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {format(new Date(notebook.updatedAt || notebook.createdAt), 'MMM d')}
            </Typography>
          </Box>
        </CardContent>

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              mt: 1,
              boxShadow: `0 8px 32px ${alpha('#000', 0.12)}`,
              border: `1px solid ${alpha('#e2e8f0', 0.5)}`,
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                fontSize: '0.875rem',
              }
            }
          }}
        >
          <MenuItem onClick={() => {
            onClick?.(notebook);
            setMenuAnchor(null);
          }}>
            <ListItemIcon>
              <Launch fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Open Notebook" />
          </MenuItem>
          
          <MenuItem onClick={() => {
            onEdit?.(notebook);
            setMenuAnchor(null);
          }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Quick Edit" />
          </MenuItem>
          
          <MenuItem onClick={() => {
            onEnhancedEdit?.(notebook);
            setMenuAnchor(null);
          }}>
            <ListItemIcon>
              <AutoAwesome fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Enhanced Editor" 
              primaryTypographyProps={{ color: 'primary' }}
            />
          </MenuItem>
          
          <Divider sx={{ my: 1 }} />
          
          <MenuItem onClick={() => {
            handleShareClick({ stopPropagation: () => {} });
            setMenuAnchor(null);
          }}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Share Notebook" />
          </MenuItem>
          
          <MenuItem onClick={() => {
            handleFavoriteToggle({ stopPropagation: () => {} });
            setMenuAnchor(null);
          }}>
            <ListItemIcon>
              {isFavorited ? <Favorite fontSize="small" color="error" /> : <FavoriteBorder fontSize="small" />}
            </ListItemIcon>
            <ListItemText 
              primary={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
              primaryTypographyProps={{ 
                color: isFavorited ? 'error' : 'inherit' 
              }}
            />
          </MenuItem>
          
          <Divider sx={{ my: 1 }} />
          
          <MenuItem 
            onClick={() => {
              onDelete?.(notebook._id);
              setMenuAnchor(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Notebook" 
              primaryTypographyProps={{ color: 'error' }}
            />
          </MenuItem>
        </Menu>
      </Card>
    </motion.div>
  );
};
