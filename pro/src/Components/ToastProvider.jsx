import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Typography,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
} from '@mui/icons-material';

// Toast context
const ToastContext = createContext(null);

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, severity = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      severity,
      title: options.title,
      duration: options.duration || 5000,
      action: options.action,
    };
    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast(message, 'error', { duration: 8000, ...options });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const icons = {
    success: <CheckCircle />,
    error: <ErrorIcon />,
    warning: <Warning />,
    info: <Info />,
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showWarning, showInfo, clearAll }}>
      {children}
      
      {/* Toast container */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxWidth: 400,
        }}
      >
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            severity={toast.severity}
            variant="filled"
            icon={icons[toast.severity]}
            onClose={() => removeToast(toast.id)}
            sx={{
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            {toast.title && (
              <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
                {toast.title}
              </AlertTitle>
            )}
            <Typography variant="body2">{toast.message}</Typography>
            {toast.action && (
              <Box sx={{ mt: 1 }}>
                {toast.action}
              </Box>
            )}
          </Alert>
        ))}
      </Box>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Default export
export default ToastProvider;
