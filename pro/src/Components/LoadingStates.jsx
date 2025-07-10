import React from 'react';
import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Fade,
  Backdrop,
} from '@mui/material';
import { motion } from 'framer-motion';

// Skeleton loading for notebook cards
export const NotebookCardSkeleton = ({ count = 6 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={16} />
                </Box>
              </Box>
              <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant="text" width="30%" height={16} />
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Skeleton loading for editor page
export const EditorSkeleton = () => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header skeleton */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="text" width={200} height={24} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>
        </Box>
      </Box>

      {/* Title skeleton */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Skeleton variant="text" width="40%" height={40} />
      </Box>

      {/* Editor content skeleton */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Skeleton variant="text" width="100%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="95%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="85%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="text" width="70%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
      </Box>
    </Box>
  );
};

// Animated loading spinner
export const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <CircularProgress size={size} thickness={4} />
      </motion.div>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

// Full page loading overlay
export const LoadingOverlay = ({ open, message = 'Loading...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2,
        backdropFilter: 'blur(4px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
      open={open}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <LoadingSpinner size={60} message={message} />
      </motion.div>
    </Backdrop>
  );
};

// Skeleton for user presence
export const UserPresenceSkeleton = () => {
  return (
    <Card sx={{ p: 2, minWidth: 200 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        <Skeleton width="60%" />
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={16} />
              <Skeleton variant="text" width="50%" height={12} />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

// Skeleton for settings dialog
export const SettingsDialogSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', height: '500px' }}>
      {/* Sidebar skeleton */}
      <Box sx={{ width: '200px', borderRight: 1, borderColor: 'divider', p: 2 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>
        ))}
      </Box>

      {/* Content skeleton */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Box>
  );
};

// Pulse animation for loading states
export const PulseLoader = ({ width = '100%', height = 20, borderRadius = 1 }) => {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Skeleton
        variant="rectangular"
        width={width}
        height={height}
        sx={{ borderRadius }}
      />
    </motion.div>
  );
};

// Staggered loading animation
export const StaggeredLoader = ({ items = 5, delay = 0.1 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * delay, duration: 0.5 }}
        >
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 2 }} />
        </motion.div>
      ))}
    </Box>
  );
};

export default {
  NotebookCardSkeleton,
  EditorSkeleton,
  LoadingSpinner,
  LoadingOverlay,
  UserPresenceSkeleton,
  SettingsDialogSkeleton,
  PulseLoader,
  StaggeredLoader,
};
