import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const AccessErrorFallback = ({ error, resetErrorBoundary }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 2,
      bgcolor: 'background.paper',
      maxWidth: 500,
      mx: 'auto',
      mt: 4
    }}
  >
    <Box sx={{ textAlign: 'center', mb: 3 }}>
      <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Access Error
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Sorry, we encountered an error while trying to verify access.
      </Typography>
    </Box>

    <Alert severity="error" sx={{ mb: 3 }}>
      <AlertTitle>Error Details</AlertTitle>
      {error.message || 'An unexpected error occurred'}
    </Alert>

    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      <Button
        variant="contained"
        startIcon={<RefreshIcon />}
        onClick={resetErrorBoundary}
      >
        Try Again
      </Button>
      <Button
        variant="outlined"
        onClick={() => window.history.back()}
      >
        Go Back
      </Button>
    </Box>
  </Paper>
);

class AccessErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to an error reporting service
    console.error('Access Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AccessErrorFallback
          error={this.state.error}
          resetErrorBoundary={() => {
            this.setState({ hasError: false, error: null });
            if (this.props.onReset) {
              this.props.onReset();
            }
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default AccessErrorBoundary;