import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Zoom,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { shake, fadeIn, getAnimationStyles } from '../utils/animations';

const DeleteNotebookDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  notebookTitle = 'this notebook',
  isDeleting = false 
}) => {
  const [isShaking, setIsShaking] = useState(false);

  const handleConfirm = () => {
    setIsShaking(true);
    setTimeout(() => {
      onConfirm();
      setIsShaking(false);
    }, 600);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
          ...getAnimationStyles(fadeIn, 'normal'),
        }
      }}
    >
      <Zoom in={open} timeout={300}>
        <Box>
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 1,
            pt: 3,
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 2,
            }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'error.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isShaking ? `${shake} 0.6s ease-in-out` : 'none',
                }}
              >
                <DeleteIcon sx={{ fontSize: 28, color: 'error.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={600} color="text.primary">
                Delete Notebook?
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ textAlign: 'center', px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
              <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="body1" color="warning.main" fontWeight={500}>
                This action cannot be undone
              </Typography>
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to delete{' '}
              <strong>"{notebookTitle}"</strong>?
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              All content, collaborators, and settings will be permanently removed.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 2, justifyContent: 'center' }}>
            <Button
              onClick={onClose}
              variant="outlined"
              size="large"
              disabled={isDeleting}
              sx={{
                minWidth: 120,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="error"
              size="large"
              disabled={isDeleting}
              startIcon={
                isDeleting ? (
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                ) : (
                  <DeleteIcon />
                )
              }
              sx={{
                minWidth: 120,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: 'error.main',
                '&:hover': {
                  bgcolor: 'error.dark',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  bgcolor: 'error.light',
                  color: 'white',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Box>
      </Zoom>
    </Dialog>
  );
};

export default DeleteNotebookDialog;
