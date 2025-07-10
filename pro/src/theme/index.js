import { createTheme } from '@mui/material/styles';

// Enhanced color palette
const colors = {
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  secondary: {
    50: '#f0fdff',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Light theme configuration
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[600],
      light: colors.secondary[400],
      dark: colors.secondary[800],
      contrastText: '#ffffff',
    },
    success: {
      main: colors.success[600],
      light: colors.success[400],
      dark: colors.success[800],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[400],
      dark: colors.warning[700],
    },
    error: {
      main: colors.error[500],
      light: colors.error[400],
      dark: colors.error[700],
    },
    background: {
      default: colors.gray[50],
      paper: '#ffffff',
      subtle: colors.gray[100],
    },
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[600],
      disabled: colors.gray[400],
    },
    divider: colors.gray[200],
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
});

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary[400],
      light: colors.primary[300],
      dark: colors.primary[600],
      contrastText: colors.gray[900],
    },
    secondary: {
      main: colors.secondary[400],
      light: colors.secondary[300],
      dark: colors.secondary[600],
      contrastText: colors.gray[900],
    },
    success: {
      main: colors.success[400],
      light: colors.success[300],
      dark: colors.success[600],
    },
    warning: {
      main: colors.warning[400],
      light: colors.warning[300],
      dark: colors.warning[600],
    },
    error: {
      main: colors.error[400],
      light: colors.error[300],
      dark: colors.error[600],
    },
    background: {
      default: colors.gray[900],
      paper: colors.gray[800],
      subtle: colors.gray[700],
    },
    text: {
      primary: colors.gray[100],
      secondary: colors.gray[400],
      disabled: colors.gray[600],
    },
    divider: colors.gray[700],
  },
  typography: lightTheme.typography,
  shape: lightTheme.shape,
  shadows: lightTheme.shadows,
});

// Component overrides for both themes
const getComponentOverrides = (theme) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: theme.shadows[2],
        },
      },
      contained: {
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: theme.shape.borderRadius,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: theme.shape.borderRadius,
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: theme.shape.borderRadius * 1.5,
      },
    },
  },
});

// Apply component overrides
lightTheme.components = getComponentOverrides(lightTheme);
darkTheme.components = getComponentOverrides(darkTheme);

export { lightTheme, darkTheme, colors };
export default lightTheme;
