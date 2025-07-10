import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Badge,
  alpha,
  Tooltip,
  Snackbar,
  Alert,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Book as BookIcon,
  People as PeopleIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 72;

const menuItems = [
  { text: 'Home', icon: HomeIcon, path: '/' },
  { text: 'My Notebooks', icon: BookIcon, path: '/notebooks' },
  { text: 'Shared with Me', icon: PeopleIcon, path: '/shared' },
  { text: 'Favorites', icon: StarIcon, path: '/favorites' },
  { text: 'Recent', icon: HistoryIcon, path: '/recent' },
  { text: 'Trash', icon: DeleteIcon, path: '/trash' },
];

const ModernLayout = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Real user data
  const [user, setUser] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar || '',
            initials: userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to basic user data
        setUser({
          name: 'User',
          email: '',
          avatar: '',
          initials: 'U'
        });
      }
    };

    fetchUserData();
  }, []);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    handleProfileMenuClose();
    navigate('/auth?mode=login');
    setSnackbar({
      open: true,
      message: 'Successfully logged out',
      severity: 'success'
    });
  };

  const sidebarWidth = sidebarOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH;

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRight: `1px solid ${theme.palette.divider}`
    }}>
      {/* Logo/Brand */}
      <Box sx={{ 
        p: sidebarOpen ? 3 : 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar sx={{ 
          width: 32, 
          height: 32, 
          bgcolor: '#6366f1',
          fontSize: '1rem',
          fontWeight: 700
        }}>
          S
        </Avatar>
        <Collapse in={sidebarOpen} orientation="horizontal">
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              lineHeight: 1.2
            }}>
              Sync-Not-Net
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Collaborate. Create. Connect.
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: sidebarOpen ? 2 : 1, py: 2 }}>
        {user ? menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Tooltip 
              key={item.text} 
              title={!sidebarOpen ? item.text : ''} 
              placement="right"
            >
              <ListItem
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  cursor: 'pointer',
                  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                  transition: 'all 0.2s ease-in-out',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  px: sidebarOpen ? 2 : 1
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit', 
                  minWidth: sidebarOpen ? 40 : 'auto',
                  justifyContent: 'center'
                }}>
                  <Icon />
                </ListItemIcon>
                <Collapse in={sidebarOpen} orientation="horizontal">
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.9rem'
                    }}
                  />
                </Collapse>
              </ListItem>
            </Tooltip>
          );
        }) : (
          <Tooltip title={!sidebarOpen ? 'Home' : ''} placement="right">
            <ListItem
              onClick={() => navigate('/')}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                cursor: 'pointer',
                backgroundColor: location.pathname === '/' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: location.pathname === '/' ? theme.palette.primary.main : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
                transition: 'all 0.2s ease-in-out',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                px: sidebarOpen ? 2 : 1
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit', 
                minWidth: sidebarOpen ? 40 : 'auto',
                justifyContent: 'center'
              }}>
                <HomeIcon />
              </ListItemIcon>
              <Collapse in={sidebarOpen} orientation="horizontal">
                <ListItemText 
                  primary="Home"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                />
              </Collapse>
            </ListItem>
          </Tooltip>
        )}
      </List>

      {/* Collapse Toggle Button */}
      {!isMobile && (
        <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} placement="right">
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                width: '100%',
                borderRadius: 2,
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* User Info */}
      {user && sidebarOpen && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              {user?.initials || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {user?.name || 'Loading...'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          color: theme.palette.text.primary,
          transition: 'all 0.3s ease'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Slogan */}
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
              display: { xs: 'none', sm: 'block' },
              fontWeight: 300
            }}
          >
            "Where ideas flourish together"
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/notebook/new')}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'flex' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                New Note
              </Button>
            )}

            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleTheme} sx={{ borderRadius: 2 }}>
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton onClick={handleNotificationOpen} sx={{ borderRadius: 2 }}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton onClick={handleProfileMenuOpen} sx={{ borderRadius: 2 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                  {user?.initials || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { md: sidebarWidth }, 
          flexShrink: { md: 0 },
          transition: 'width 0.3s ease'
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarWidth,
              bgcolor: 'background.paper',
              transition: 'width 0.3s ease',
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          transition: 'all 0.3s ease'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }} />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        <MenuItem onClick={() => navigate('/profile')} sx={{ borderRadius: 1 }}>
          <SettingsIcon sx={{ mr: 2 }} />
          Profile Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ borderRadius: 1, color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 300
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </Box>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModernLayout;
