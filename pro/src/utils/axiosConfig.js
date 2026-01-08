import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      
      // Show error message
      const snackbar = document.createElement('div');
      snackbar.style.position = 'fixed';
      snackbar.style.bottom = '20px';
      snackbar.style.left = '50%';
      snackbar.style.transform = 'translateX(-50%)';
      snackbar.style.backgroundColor = '#f44336';
      snackbar.style.color = 'white';
      snackbar.style.padding = '14px';
      snackbar.style.borderRadius = '4px';
      snackbar.textContent = 'Session expired. Please sign in again.';
      document.body.appendChild(snackbar);
      
      // Redirect after showing message
      setTimeout(() => {
        window.location.href = '/auth?mode=login';
        snackbar.remove();
      }, 2000);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;