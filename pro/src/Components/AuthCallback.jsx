import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      navigate('/notebooks');
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  return <div>Authenticating...</div>;
}

export default AuthCallback;
