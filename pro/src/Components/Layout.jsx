import React, { useEffect, useState, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Container,
  Avatar,
  Tooltip,
  Button,
  Divider,
  useScrollTrigger,
  Menu,
  MenuItem,
  alpha,
  Grid2 as Grid,
  InputBase,
  useMediaQuery,
  Paper,
  Collapse,
  
  Chip
} from '@mui/material';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {

  Settings,
  Bell,
  Menu as MenuIcon,
  Plus,
  Book,
  Home,
  FileText,
  Users,
  Star,
  LogOut,
  Search,
  ChevronLeft,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  GridIcon,
  Moon,
  Sun,
  Bookmark,
  Clock,
  Heart,
  Trash2,
  Mail,
  HelpCircle,
  Shield,
  BarChart2,
  Download,
  Upload,
  Info,
  MessageCircle,
  AtSign as At,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAVBAR_HEIGHT = 70;

// Enhanced color schemes with options for dark mode
const themes = {
  light: {
    primary: {
      main: '#4f46e5',
      light: '#6366f1',
      dark: '#4338ca',
      gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    },
    secondary: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
      subtle: '#f3f4f6',
      highlight: 'rgba(99, 102, 241, 0.08)',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      disabled: '#9ca3af',
    },
    navbar: {
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    },
    secondary: {
      main: '#38bdf8',
      light: '#7dd3fc',
      dark: '#0284c7',
    },
    background: {
      default: '#111827',
      paper: '#1f2937',
      subtle: '#1e293b',
      highlight: 'rgba(99, 102, 241, 0.15)',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      disabled: '#6b7280',
    },
    navbar: {
      background: 'rgba(31, 41, 55, 0.85)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  }
};

function ElevationScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window ? window() : undefined,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    sx: {
      ...children.props.sx,
      transition: 'all 0.3s ease',
      opacity: trigger ? 1 : 0.95,
    }
  });
}

const menuItems = [
  { text: 'Home', icon: Home, path: '/' },
  { text: 'My Notebooks', icon: Book, path: '/notebooks' },
  { text: 'Shared with Me', icon: Users, path: '/shared' },
  { text: 'Favorites', icon: Heart, path: '/favorites' },
  { text: 'Recent Activity', icon: Clock, path: '/recent' },
  { text: 'Trash', icon: Trash2, path: '/trash' },
  { text: 'Settings', icon: Settings, path: '/settings' },
];

const quickLinkItems = [
  { text: 'Documentation', icon: FileText, path: '/docs' },
  { text: 'Help Center', icon: HelpCircle, path: '/help' },
  { text: 'Privacy Policy', icon: Shield, path: '/privacy' },
  { text: 'Analytics', icon: BarChart2, path: '/analytics' },
];

function Layout(props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(['note organization', 'markdown formatting', 'sharing options']);
  const searchInputRef = useRef(null);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isMobileSearch = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Path-based conditionals
  const isNotebookPage = location.pathname.includes('/Notebook/');
  const isHomePage = location.pathname === '/';
  const currentTheme = darkMode ? themes.dark : themes.light;
  
  // Mock user data
  const user = {
    name: 'Prit Vasani',
    initials: 'PV',
    avatar: '', // Replace with actual avatar path
    email: 'prit@syncnotenets.com',
    role: 'Pro Member',
    notificationCount: 5
  };

  // Mock notifications
  const notifications = [
    { id: 1, type: 'mention', message: 'Michael mentioned you in "Project Ideas"', time: '5m ago', read: false },
    { id: 2, type: 'share', message: 'Sara shared a notebook with you', time: '1h ago', read: false },
    { id: 3, type: 'system', message: 'Your storage is almost full (85%)', time: '2h ago', read: false },
    { id: 4, type: 'comment', message: 'New comment on your research notes', time: '5h ago', read: true },
    { id: 5, type: 'update', message: 'System update completed successfully', time: 'Yesterday', read: true }
  ];

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('token');
    handleMenuClose();
    navigate('/auth?mode=login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches if not already included
      if (!recentSearches.includes(searchQuery.trim())) {
        setRecentSearches(prev => [searchQuery.trim(), ...prev.slice(0, 2)]);
      }
      console.log('Searching for:', searchQuery);
      // Implement actual search functionality here
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: currentTheme.background.default,
      backgroundImage: darkMode 
        ? 'radial-gradient(at 40% 20%, rgba(79, 70, 229, 0.1) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(14, 165, 233, 0.1) 0px, transparent 50%)'
        : 'radial-gradient(at 40% 20%, rgba(79, 70, 229, 0.07) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(14, 165, 233, 0.05) 0px, transparent 50%)',
      color: currentTheme.text.primary,
      transition: 'all 0.3s ease-in-out'
    }}>
      <ElevationScroll {...props}>
        <AppBar
          position="fixed"
          color="inherit"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: currentTheme.navbar.background,
            borderBottom: '1px solid',
            borderColor: currentTheme.divider,
            backdropFilter: currentTheme.navbar.backdropFilter,
            boxShadow: currentTheme.navbar.boxShadow,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <Toolbar sx={{ height: NAVBAR_HEIGHT, px: { xs: 1, sm: 2 } }}>
            {/* Back Navigation */}
            <AnimatePresence>
              {isNotebookPage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Tooltip title="Back to Notebooks">
                    <IconButton
                      onClick={() => navigate(-1)}
                      sx={{ 
                        mr: 1,
                        color: currentTheme.text.primary,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: alpha(currentTheme.primary.main, 0.1)
                        }
                      }}
                    >
                      <ChevronLeft size={24} />
                    </IconButton>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logo Section */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'inherit',
                mr: 2
              }}
            >
              <Box sx={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 36, 
                height: 36, 
                borderRadius: 1,
                background: currentTheme.primary.gradient,
                boxShadow: `0 2px 8px ${alpha(currentTheme.primary.main, 0.3)}`
              }}>
                <Book size={20} color="white" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.5,
                  background: currentTheme.primary.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                SyncNote
              </Typography>
            </Box>

            {/* Mobile Menu Button (visible on smaller screens) */}
            <IconButton
              sx={{ 
                display: { xs: 'flex', md: 'none' },
                mr: 1,
                color: currentTheme.text.primary
              }}
              onClick={() => setOpenDrawer(true)}
            >
              <MenuIcon size={22} />
            </IconButton>

            {/* Desktop Navigation (hidden on smaller screens) */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center',
              ml: 2,
              mr: 3,
              gap: 1
            }}>
              {menuItems.slice(0, isTablet ? 3 : 5).map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  startIcon={<item.icon size={18} />}
                  variant={location.pathname === item.path ? "contained" : "text"}
                  sx={{
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: location.pathname === item.path 
                      ? '#fff' 
                      : currentTheme.text.secondary,
                    bgcolor: location.pathname === item.path 
                      ? currentTheme.primary.main 
                      : 'transparent',
                    '&:hover': {
                      bgcolor: location.pathname === item.path 
                        ? currentTheme.primary.dark 
                        : alpha(currentTheme.primary.main, 0.08),
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
              
              {/* More menu for extra nav items on desktop */}
              {isTablet && (
                <Tooltip title="More">
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ color: currentTheme.text.secondary }}
                  >
                    <MenuIcon size={20} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Search Bar */}
            <Box sx={{ 
              position: 'relative',
              mr: 2,
              flex: searchExpanded ? 1 : 'unset',
              display: { xs: searchExpanded ? 'block' : 'none', sm: 'block' },
              transition: 'all 0.3s ease'
            }}>
              <AnimatePresence>
                {(!isMobileSearch || searchExpanded) && (
                  <motion.div
                    initial={{ opacity: 0, width: isMobileSearch ? 0 : '100%' }}
                    animate={{ opacity: 1, width: '100%' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Paper
                      component="form"
                      onSubmit={handleSearchSubmit}
                      elevation={0}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        height: 40,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: alpha(currentTheme.background.subtle, 0.8),
                        border: '1px solid',
                        borderColor: alpha(currentTheme.divider, 0.8),
                        '&:hover, &:focus-within': {
                          bgcolor: alpha(currentTheme.background.paper, 0.8),
                          borderColor: currentTheme.primary.main,
                          boxShadow: `0 0 0 2px ${alpha(currentTheme.primary.main, 0.2)}`
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Search size={18} color={currentTheme.text.secondary} />
                      <InputBase
                        inputRef={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notebooks..."
                        sx={{
                          ml: 1,
                          flex: 1,
                          fontSize: '0.9rem',
                          color: currentTheme.text.primary,
                          '& input::placeholder': {
                            color: currentTheme.text.disabled,
                            opacity: 1
                          }
                        }}
                      />
                      {searchQuery && (
                        <IconButton 
                          size="small" 
                          onClick={() => setSearchQuery('')}
                          sx={{ p: 0.5 }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                      {searchExpanded && isMobileSearch && (
                        <Button 
                          size="small" 
                          onClick={toggleSearch}
                          sx={{ 
                            ml: 1,
                            minWidth: 'auto',
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            color: currentTheme.text.secondary
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Paper>
                    
                    {/* Recent searches dropdown */}
                    <Collapse in={Boolean(searchQuery) && recentSearches.length > 0}>
                      <Paper
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          mt: 0.5,
                          zIndex: 100,
                          borderRadius: 2,
                          boxShadow: theme.shadows[8],
                          p: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: currentTheme.text.secondary }}>
                          Recent Searches
                        </Typography>
                        <List disablePadding>
                          {recentSearches.map((search) => (
                            <ListItem 
                              key={search} 
                              button 
                              dense
                              onClick={() => {
                                setSearchQuery(search);
                                searchInputRef.current?.focus();
                              }}
                              sx={{ 
                                borderRadius: 1,
                                py: 0.5
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <Clock size={16} color={currentTheme.text.secondary} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={search} 
                                primaryTypographyProps={{
                                  fontSize: '0.9rem'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Collapse>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            {/* Spacer to push action icons to the right */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
              {/* Search button for mobile */}
              {isMobileSearch && !searchExpanded && (
                <Tooltip title="Search">
                  <IconButton 
                    onClick={toggleSearch}
                    sx={{ color: currentTheme.text.secondary }}
                  >
                    <Search size={20} />
                  </IconButton>
                </Tooltip>
              )}

              {/* Create New Notebook */}
              <Tooltip title="New Notebook">
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => navigate('/Notebook/new')}
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    px: 2,
                    py: 0.75,
                    borderRadius: 1.5,
                    background: currentTheme.primary.gradient,
                    boxShadow: `0 4px 12px ${alpha(currentTheme.primary.main, 0.3)}`,
                    '&:hover': {
                      boxShadow: `0 6px 16px ${alpha(currentTheme.primary.main, 0.4)}`,
                    }
                  }}
                >
                  New Notebook
                </Button>
              </Tooltip>
              
              {/* Mobile New Notebook button */}
              <Tooltip title="New Notebook">
                <IconButton
                  sx={{ 
                    display: { xs: 'flex', sm: 'none' },
                    color: 'white',
                    background: currentTheme.primary.gradient,
                    '&:hover': { bgcolor: currentTheme.primary.main }
                  }}
                  onClick={() => navigate('/Notebook/new')}
                >
                  <Plus size={20} />
                </IconButton>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
                <IconButton
                  onClick={toggleDarkMode}
                  sx={{ color: currentTheme.text.secondary }}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  onClick={handleNotificationsOpen}
                  sx={{ 
                    color: currentTheme.text.secondary,
                    position: 'relative'
                  }}
                >
                  <Bell size={20} />
                  {user.notificationCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: currentTheme.secondary.main,
                        border: `2px solid ${currentTheme.navbar.background}`,
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>

              {/* User Profile */}
              <Tooltip title="Account">
                <IconButton 
                  onClick={handleProfileMenuOpen}
                  sx={{ ml: { xs: 0.5, sm: 1 } }}
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: currentTheme.primary.main,
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      border: '2px solid',
                      borderColor: alpha(currentTheme.primary.light, 0.3)
                    }}
                  >
                    {user.initials}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
      </ElevationScroll>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 230,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            bgcolor: currentTheme.background.paper,
            border: '1px solid',
            borderColor: currentTheme.divider,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: currentTheme.background.paper,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderTop: '1px solid',
              borderLeft: '1px solid',
              borderColor: currentTheme.divider,
            },
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{
                width: 42,
                height: 42,
                bgcolor: currentTheme.primary.main,
                fontWeight: 500,
                fontSize: '1rem',
                border: '2px solid',
                borderColor: alpha(currentTheme.primary.light, 0.3)
              }}
            >
              {user.initials}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Chip 
            size="small" 
            label={user.role} 
            sx={{ 
              fontSize: '0.7rem', 
              bgcolor: alpha(currentTheme.primary.main, 0.1),
              color: currentTheme.primary.main,
              fontWeight: 500,
              borderRadius: 1
            }} 
          />
        </Box>
        
        <Divider sx={{ borderColor: currentTheme.divider }} />
        
        <List disablePadding sx={{ py: 1 }}>
          <ListItem 
            button 
            onClick={() => {
              handleMenuClose();
              navigate('/profile');
            }}
            sx={{ px: 2, py: 0.75 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Settings size={18} color={currentTheme.text.secondary} />
            </ListItemIcon>
            <ListItemText 
              primary="Account Settings" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItem>
          
          <ListItem 
            button 
            onClick={() => {
              handleMenuClose();
              navigate('/analytics');
            }}
            sx={{ px: 2, py: 0.75 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <BarChart2 size={18} color={currentTheme.text.secondary} />
            </ListItemIcon>
            <ListItemText 
              primary="Analytics" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItem>
          
          <ListItem 
            button 
            onClick={() => {
              handleMenuClose();
              navigate('/backups');
            }}
            sx={{ px: 2, py: 0.75 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Upload size={18} color={currentTheme.text.secondary} />
            </ListItemIcon>
            <ListItemText 
              primary="Backup & Export" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItem>
        </List>
        
        <Divider sx={{ borderColor: currentTheme.divider }} />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            color: 'error.main',
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: alpha('#f87171', 0.1)
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogOut size={18} color="#f87171" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ 
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#f87171'
            }}
          />
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            bgcolor: currentTheme.background.paper,
            border: '1px solid',
            borderColor: currentTheme.divider,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: currentTheme.background.paper,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderTop: '1px solid',
              borderLeft: '1px solid',
              borderColor: currentTheme.divider,
            },
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          <Button
            size="small"
            sx={{ 
              fontSize: '0.75rem',
              color: currentTheme.primary.main,
              textTransform: 'none',
              '&:hover': {
                bgcolor: alpha(currentTheme.primary.main, 0.05)
              }
            }}
          >
            Mark all as read
          </Button>
        </Box>
        
        <Divider sx={{ borderColor: currentTheme.divider }} />
        
        <List sx={{ py: 0 }}>
          {notifications.map((notification) => (
            <ListItem
              key={notification.id}
              alignItems="flex-start"
              button
              sx={{
                px: 2,
                py: 1.5,
                borderLeft: notification.read ? 'none' : `3px solid ${currentTheme.primary.main}`,
                bgcolor: notification.read ? 'transparent' : alpha(currentTheme.primary.main, 0.05),
                '&:hover': {
                  bgcolor: alpha(currentTheme.primary.main, 0.08)
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                {notification.type === 'mention' && <At size={18} color={currentTheme.primary.main} />}
                {notification.type === 'share' && <Users size={18} color={currentTheme.secondary.main} />}
                {notification.type === 'system' && <Info size={18} color="#f59e0b" />}
                {notification.type === 'comment' && <MessageCircle size={18} color="#10b981" />}
                {notification.type === 'update' && <Download size={18} color="#6366f1" />}
              </ListItemIcon>
              <ListItemText
                primary={notification.message}
                secondary={notification.time}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: notification.read ? 400 : 500,
                  color: currentTheme.text.primary
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: currentTheme.text.disabled
                }}
              />
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ borderColor: currentTheme.divider }} />
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => {
              handleNotificationsClose();
              navigate('/notifications');
            }}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              fontSize: '0.85rem'
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: currentTheme.background.paper,
            borderRight: '1px solid',
            borderColor: currentTheme.divider,
          },
        }}
      >
        <Box sx={{ pt: `${NAVBAR_HEIGHT}px` }}>
          <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar
                src={user.avatar}
                alt={user.name}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: currentTheme.primary.main,
                  fontWeight: 500,
                  fontSize: '1rem',
                  border: '2px solid',
                  borderColor: alpha(currentTheme.primary.light, 0.3)
                }}
              >
                {user.initials}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => {
                setOpenDrawer(false);
                navigate('/Notebook/new');
              }}
              sx={{
                textTransform: 'none',
                fontSize: '0.9rem',
                py: 1,
                borderRadius: 1.5,
                background: currentTheme.primary.gradient,
                boxShadow: `0 4px 12px ${alpha(currentTheme.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(currentTheme.primary.main, 0.4)}`,
                }
              }}
            >
              New Notebook
            </Button>
          </Box>
          
          <Divider sx={{ borderColor: currentTheme.divider }} />
          
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                button
                selected={location.pathname === item.path}
                onClick={() => {
                  setOpenDrawer(false);
                  navigate(item.path);
                }}
                sx={{
                  px: 2,
                  py: 1,
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: location.pathname === item.path ? alpha(currentTheme.primary.main, 0.15) : 'transparent',
                  '&.Mui-selected': {
                    bgcolor: alpha(currentTheme.primary.main, 0.15),
                  },
                  '&:hover': {
                    bgcolor: location.pathname === item.path 
                      ? alpha(currentTheme.primary.main, 0.2)
                      : alpha(currentTheme.primary.main, 0.08),
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? currentTheme.primary.main : currentTheme.text.secondary }}>
                  <item.icon size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? currentTheme.primary.main : currentTheme.text.primary
                  }}
                />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ borderColor: currentTheme.divider, my: 1 }} />
          
          <Typography
            variant="overline"
            sx={{
              px: 3,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: currentTheme.text.disabled,
              letterSpacing: 1,
            }}
          >
            Quick Links
          </Typography>
          
          <List>
            {quickLinkItems.map((item) => (
              <ListItem
                key={item.text}
                button
                dense
                selected={location.pathname === item.path}
                onClick={() => {
                  setOpenDrawer(false);
                  navigate(item.path);
                }}
                sx={{
                  px: 2,
                  py: 0.75,
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: alpha(currentTheme.primary.main, 0.15),
                  },
                  '&:hover': {
                    bgcolor: alpha(currentTheme.primary.main, 0.08),
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTheme.text.secondary }}>
                  <item.icon size={18} />
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    color: currentTheme.text.primary
                  }}
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ p: 2, mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<LogOut size={18} />}
              onClick={handleLogout}
              sx={{
                textTransform: 'none',
                fontSize: '0.9rem',
                py: 1,
                borderColor: alpha('#f87171', 0.5),
                color: '#f87171',
                '&:hover': {
                  borderColor: '#f87171',
                  bgcolor: alpha('#f87171', 0.05),
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${NAVBAR_HEIGHT}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Outlet />
        
       {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Sync Note Net</h3>
              <p className="text-gray-400">
                The intelligent collaborative note-taking platform for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Legal</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© 2025 Sync Note Net. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </Box>
    </Box>
  );
}

export default Layout;