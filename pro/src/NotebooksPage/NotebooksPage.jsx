import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid2, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NotebooksPage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch notebooks from the backend
    const fetchNotebooks = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log(token);
        
        const response = await axios.get('http://localhost:5000/api/notebooks', {
          headers: {
            "Authorization": token, // Send JWT token
          },
        });
        // fetch('http://localhost:5000/api/notebooks',{headers:{"Authorization":token}}).then((res)=>res.json()).then((res)=>setNotebooks(res))
        setNotebooks(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notebooks:', error);
        setLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  const handleNotebookClick = (notebookId) => {
    // Navigate to the notebook editor page
    navigate('/notebook', { state: { notebookId: notebookId } });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: '40px',
        background: 'none', // Use random pastel background
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: '30px' }}>
        Your Notebooks
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid2 container spacing={4}>
          {notebooks.map((notebook) => (
            <Grid2 item xs={12} sm={6} md={4} key={notebook._id}>
              <Card
                sx={{
                  padding: '20px',
                  height: '250px',
                  backgroundColor: '#fff',
                  borderRadius: '15px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  },
                }}
                onClick={() => handleNotebookClick(notebook._id)}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    {notebook.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {/* Display preview of the content (first 100 characters) */}
                    {notebook.content ? notebook.content.substring(0, 100) + '...' : 'No content available'}
                  </Typography>
                </CardContent>

                <Button
                  variant="contained"
                  size="small"
                  sx={{ marginTop: '15px' }}
                  onClick={() => handleNotebookClick(notebook._id)}
                >
                  Open Notebook
                </Button>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      )}
    </Box>
  );
};

export default NotebooksPage;
