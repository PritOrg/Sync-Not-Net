import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  BugReport,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Here you could also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, minimal = false } = this.props;

      // If a custom fallback component is provided, use it
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        );
      }

      // Minimal error display for smaller components
      if (minimal) {
        return (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={this.handleRetry}>
                Retry
              </Button>
            }
          >
            Something went wrong. Please try again.
          </Alert>
        );
      }

      // Full error boundary display
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                maxWidth: 600,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <ErrorOutline
                    sx={{
                      fontSize: 64,
                      color: 'error.main',
                      mb: 2,
                    }}
                  />
                </motion.div>

                <Typography variant="h4" gutterBottom color="error">
                  Oops! Something went wrong
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  We're sorry, but something unexpected happened. Don't worry, your data is safe.
                  You can try refreshing the page or contact support if the problem persists.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={this.handleRetry}
                    sx={{ minWidth: 120 }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={this.handleReload}
                    sx={{ minWidth: 120 }}
                  >
                    Reload Page
                  </Button>
                </Box>

                {/* Error details for development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Box sx={{ textAlign: 'left' }}>
                    <Button
                      startIcon={<BugReport />}
                      endIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                      onClick={this.toggleDetails}
                      size="small"
                      sx={{ mb: 2 }}
                    >
                      {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                    </Button>

                    <Collapse in={this.state.showDetails}>
                      <Alert severity="error" sx={{ textAlign: 'left' }}>
                        <AlertTitle>Error Details (Development Mode)</AlertTitle>
                        <Typography
                          component="pre"
                          variant="body2"
                          sx={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: 200,
                            overflow: 'auto',
                            mt: 1,
                          }}
                        >
                          {this.state.error.toString()}
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </Alert>
                    </Collapse>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Custom error fallback components
export const MinimalErrorFallback = ({ onRetry }) => (
  <Alert
    severity="error"
    action={
      <Button size="small" onClick={onRetry}>
        Retry
      </Button>
    }
  >
    Something went wrong. Please try again.
  </Alert>
);

export const InlineErrorFallback = ({ error, onRetry }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      border: 1,
      borderColor: 'error.main',
      borderRadius: 1,
      bgcolor: 'error.light',
      color: 'error.contrastText',
    }}
  >
    <ErrorOutline sx={{ mr: 1 }} />
    <Typography variant="body2" sx={{ mr: 2 }}>
      Failed to load content
    </Typography>
    <Button size="small" variant="outlined" onClick={onRetry}>
      Retry
    </Button>
  </Box>
);

export default ErrorBoundary;
