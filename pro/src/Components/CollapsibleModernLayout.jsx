import React, { useState, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  useTheme,
  Collapse
} from '@mui/material';
import {
  KeyboardArrowUp as CollapseIcon,
  KeyboardArrowDown as ExpandIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

// Debounce helper
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const CollapsibleModernLayout = ({
  toolbarContent,
  children,
  initialCollapsed = false,
  hideOnMobile = true,
  disableCollapse = false
}) => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mediaQueryMatches, setMediaQueryMatches] = useState(false);
  
  // Debounced media query handler
  const handleMediaQueryChange = useCallback(
    debounce((matches) => {
      setMediaQueryMatches(matches);
    }, 100),
    []
  );
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true,
    defaultMatches: mediaQueryMatches,
    onChange: handleMediaQueryChange
  });
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  // Debounced collapse handler
  const toggleCollapse = useCallback(
    debounce(() => {
      if (!disableCollapse) {
        setIsCollapsed(prev => !prev);
      }
    }, 100),
    [disableCollapse]
  );

  // Do not render the collapsible toolbar on mobile if hideOnMobile is true
  if (isMobile && hideOnMobile) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <Collapse 
          in={!isCollapsed} 
          collapsedSize={0}
          timeout={200}
        >
          <Box sx={{ p: 2 }}>
            {toolbarContent}
          </Box>
        </Collapse>
        {!disableCollapse && toolbarContent && (
          <Box 
            sx={{ 
              borderTop: isCollapsed ? 0 : 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <IconButton
              size="small"
              onClick={toggleCollapse}
              sx={{ 
                borderRadius: '0 0 8px 8px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
            </IconButton>
          </Box>
        )}
      </AppBar>

      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 0,
          transition: 'all 0.2s ease-in-out'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default CollapsibleModernLayout;
