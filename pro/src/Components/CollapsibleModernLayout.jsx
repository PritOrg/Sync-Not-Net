import React from 'react';
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

const CollapsibleModernLayout = ({
  toolbarContent,
  children,
  initialCollapsed = false,
  hideOnMobile = true,
  disableCollapse = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(`sm`));
  const [isCollapsed, setIsCollapsed] = React.useState(initialCollapsed);

  // Do not render the collapsible toolbar on mobile if hideOnMobile is true
  if (isMobile && hideOnMobile) {
    return (
      <Box sx={{ height: `100%`, display: `flex`, flexDirection: `column` }}>
        {children}
      </Box>
    );
  }

  const toggleCollapse = () => {
    if (!disableCollapse) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <Box sx={{ height: `100%`, display: `flex`, flexDirection: `column` }}>
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: `divider`,
          bgcolor: `background.paper`
        }}
      >
        <Collapse in={!isCollapsed} collapsedSize={0}>
          <Box sx={{ p: 2 }}>
            {toolbarContent}
          </Box>
        </Collapse>
        {!disableCollapse && toolbarContent && (
          <Box 
            sx={{ 
              borderTop: isCollapsed ? 0 : 1,
              borderColor: `divider`,
              display: `flex`,
              justifyContent: `center`,
              bgcolor: `background.paper`
            }}
          >
            <IconButton
              size="small"
              onClick={toggleCollapse}
              sx={{ 
                borderRadius: '0 0 8px 8px',
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

      <Box sx={{ flex: 1, overflowY: `auto`, p: 0 }}>
        {children}
      </Box>
    </Box>
  );
};

export default CollapsibleModernLayout;
