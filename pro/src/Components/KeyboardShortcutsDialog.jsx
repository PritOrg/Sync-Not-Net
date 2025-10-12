import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import { KeyboardShortcuts } from '../utils/keyboardShortcuts';
import CloseIcon from '@mui/icons-material/Close';

const KeyboardShortcutsDialog = ({ open, onClose }) => {
  const theme = useTheme();

  // Map keyboard shortcuts configuration to display format
  const shortcuts = Object.entries(KeyboardShortcuts).map(([id, config]) => ({
    keys: config.keys.map(combo => combo.split('+')),
    description: config.description
  }));

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6">Keyboard Shortcuts</Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {shortcuts.map((shortcut, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.5,
              borderBottom: index < shortcuts.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
            }}
          >
            <Typography variant="body1">{shortcut.description}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {shortcut.keys[0].map((key, keyIndex) => (
                <Typography
                  key={keyIndex}
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    fontWeight: 'medium',
                    color: theme.palette.text.primary,
                    display: 'inline-block',
                    minWidth: '1.5rem',
                    textAlign: 'center'
                  }}
                >
                  {key}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;