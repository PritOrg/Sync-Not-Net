import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation to the notebook list page
import { Box, Button, TextField, Typography, Snackbar } from '@mui/material';
// import { io } from 'socket.io-client'; // Optional for real-time features
import axios from 'axios';
import { useTheme } from '@mui/material/styles';

const SignInSignUpPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between sign-in and sign-up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only needed for sign-up
  const [errorMessage, setErrorMessage] = useState(''); // For displaying error messages
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar to show error message

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Sign Up logic
        const response = await axios.post('http://localhost:5000/api/users/register', { name, email, password });
        console.log(response.data); // Handle successful registration
        navigate('/notebooks'); // Redirect to notebook list
      } else {
        // Login logic
        const response = await axios.post('http://localhost:5000/api/users/login', { email, password });
        console.log(response.data); // Handle successful login
        localStorage.setItem('token', response.data.token); // Store token for authentication
        navigate('/notebooks'); // Redirect to notebook list
      }
    } catch (error) {
      if (!isSignUp && error.response.status === 404) {
        // User does not exist, switch to Sign Up with email prefilled
        setIsSignUp(true);
        setPassword(''); // Clear password
        setErrorMessage('User does not exist. Please register.');
      } else {
        setErrorMessage('Error: ' + error.response.data.message);
      }
      setSnackbarOpen(true);
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setErrorMessage('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'none', // Keep the random pastel background as is
        padding: '20px',
      }}
    >
      <Box
        sx={{
          width: '400px',
          padding: '40px',
          backgroundColor: '#fff',
          borderRadius: '15px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ marginBottom: '20px', fontWeight: 'bold', color: theme.palette.primary.main }}>
          {isSignUp ? 'Register' : 'Login'}
        </Typography>

        <form onSubmit={handleFormSubmit}>
          {isSignUp && (
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
          )}

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            required
            type="email"
          />

          <TextField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            required
            type="password"
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            type="submit"
            sx={{ marginTop: '20px', padding: '10px', backgroundColor: theme.palette.primary.dark }}
          >
            {isSignUp ? 'Register' : 'Login'}
          </Button>
        </form>

        <Button
          onClick={toggleForm}
          sx={{
            marginTop: '20px',
            textDecoration: 'underline',
            color: theme.palette.primary.main,
          }}
        >
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Register"}
        </Button>
      </Box>

      {/* Snackbar for error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={errorMessage}
      />
    </Box>
  );
};

export default SignInSignUpPage;
