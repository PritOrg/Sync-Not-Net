const config = {
  apiUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  socketUrl: process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  isDev: process.env.NODE_ENV === 'development',
  passwordMinLength: 6,
};

export default config;
