import React, { useEffect, useState } from 'react';
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
  Grid2 as Grid
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
  GridIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAVBAR_HEIGHT = 64;

// Professional color schemes
const themes = {
  light: {
    primary: {
      main: '#2563eb',
      gradient: 'linear-gradient(to right, #2563eb, #1d4ed8)',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    navbar: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
    }
  }
};

function ElevationScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    sx: {
      bgcolor: trigger ? 'navbar.background' : 'transparent',
      backdropFilter: trigger ? 'blur(10px)' : 'none',
    }
  });
}

const menuItems = [
  { text: 'Home', icon: Home, path: '/' },
  { text: 'My Notebooks', icon: Book, path: '/notebooks' },
  { text: 'Shared', icon: Users, path: '/shared' },
  { text: 'Favorites', icon: Star, path: '/favorites' },
  { text: 'Settings', icon: Settings, path: '/settings' },
];

function Layout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);

  // const isNotebookPage = location.pathname.includes('/Notebook/');
  const isHomePage = location.pathname === '/';
  const user = {
    name: 'Prit Vasani'.toUpperCase(),
    avatar: '', // Replace with actual avatar path
    email: 'prit@mail.notnet'
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Add logout logic here
    handleMenuClose();
    navigate('/SignInSignUp');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      backgroundImage: 'radial-gradient(at 10% 10%, rgba(37, 99, 235, 0.05) 0px, transparent 50%)',
    }}>
      <ElevationScroll>
        <AppBar
          position="fixed"
          color="inherit"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: themes.light.navbar.background,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {/* Back Navigation for Notebook pages */}
            {!isHomePage && (
              <Tooltip title="Back to Notebooks">
                <IconButton
                  onClick={() => navigate(-1)}
                  sx={{ mr: 1 }}
                >
                  <ChevronLeft size={24} />
                </IconButton>
              </Tooltip>
            )}
            {/* Logo Section */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <Book size={24} color={themes.light.primary.main} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: themes.light.primary.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Sync Note Net
              </Typography>
            </Box>

            {/* Search Bar */}
            <AnimatePresence>
              {searchVisible && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                      flex: 1
                    }}
                  >
                    <Search size={20} />
                    <input
                      placeholder="Search notebooks..."
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'none',
                        padding: '8px 12px',
                        width: '100%',
                        fontSize: '16px'
                      }}
                    />
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            <Box sx={{ flexGrow: 1 }} />
            {/* Add Notebooks Grid View Button */}
            <Tooltip title="View Notebooks">
              <IconButton
                onClick={() => navigate('/notebooks')}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                <GridIcon size={20} />
              </IconButton>
            </Tooltip>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="New Notebook">
                <Button
                  variant="contained"
                  startIcon={<Plus size={20} />}
                  onClick={() => navigate('/Notebook/new')}
                  sx={{
                    bgcolor: themes.light.primary.main,
                    '&:hover': {
                      bgcolor: alpha(themes.light.primary.main, 0.9)
                    }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    New Notebook
                  </Box>
                </Button>
              </Tooltip>

              <Tooltip title="Search">
                <IconButton onClick={() => setSearchVisible(!searchVisible)}>
                  <Search size={20} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Notifications">
                <IconButton>
                  <Badge badgeContent={3} color="primary">
                    <Bell size={20} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Account">
                <IconButton onClick={handleProfileMenuOpen}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: themes.light.primary.main
                    }}
                  >
                    {user.name[0]}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <IconButton
                sx={{ display: { xs: 'block', md: 'none' } }}
                onClick={() => setOpenDrawer(true)}
              >
                <MenuIcon size={20} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      </ElevationScroll>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <Settings size={20} />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${NAVBAR_HEIGHT}px`,
          minHeight: '100vh',
          '& > *': {
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
              zIndex: -1,
            }
          }
        }}
      >
        <Container
          maxWidth={!isHomePage ? false : 'lg'}
          sx={{
            py: 3,
            px: !isHomePage ? 0 : 3
          }}
        >
          <Outlet />
        </Container>
      </Box>

      {/* Side Navigation Drawer */}
      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ pt: `${NAVBAR_HEIGHT}px` }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                button
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setOpenDrawer(false);
                }}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(themes.light.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(themes.light.primary.main, 0.15),
                    }
                  }
                }}
              >
                <ListItemIcon>
                  <item.icon size={20} color={location.pathname === item.path ? themes.light.primary.main : undefined} />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      color: location.pathname === item.path ? themes.light.primary.main : 'text.primary'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: 6,
          px: 3,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* About Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                About Sync Note Net
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sync Note Net is a collaborative note-taking platform designed for developers 
                and teams. Our mission is to provide a seamless experience for sharing knowledge 
                and working together effectively.
              </Typography>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <List dense>
                {menuItems.map((item) => (
                  <ListItem 
                    key={item.text} 
                    component={Link} 
                    to={item.path}
                    sx={{ 
                      color: 'text.secondary',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {item.text}
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Social Links */}
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                Follow Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {[
                  { Icon: Facebook, url: '#' },
                  { Icon: Twitter, url: '#' },
                  { Icon: Instagram, url: '#' },
                  { Icon: Linkedin, url: '#' }
                ].map(({ Icon, url }) => (
                  <IconButton
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <Icon size={20} />
                  </IconButton>
                ))}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Copyright */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
          >
            © {new Date().getFullYear()} Sync Note Net. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;