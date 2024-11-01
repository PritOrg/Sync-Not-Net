import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { Edit, Timer, CalendarMonth, OpenInNew } from '@mui/icons-material';

const NotebooksPage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to strip HTML tags and decode entities
  const stripHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText;
  };

  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/notebooks', {
          headers: {
            "Authorization": token,
          },
        });
        setNotebooks(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notebooks:', error);
        setLoading(false);
      }
    };
    fetchNotebooks();
  }, []);

  const handleNotebookClick = (urlIdentifier) => {
    navigate('/Notebook/' + urlIdentifier);
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196f3, #1976d2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Your Notebooks
        </Typography>
        
        <Button 
          variant="contained"
          onClick={() => navigate('/Notebook/new')}
          startIcon={<Edit />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            background: 'linear-gradient(45deg, #2196f3, #1976d2)',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
          }}
        >
          Create New
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {notebooks.map((notebook) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={notebook._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(145deg, #ffffff, #f5f7fa)',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {notebook.title || 'Untitled Notebook'}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {stripHtml(notebook.content) || 'No content available'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Created: {format(new Date(notebook.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timer fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Updated: {formatDistanceToNow(new Date(notebook.updatedAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleNotebookClick(notebook.urlIdentifier)}
                    endIcon={<OpenInNew />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #2196f3, #1976d2)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                        boxShadow: '0 6px 16px rgba(33, 150, 243, 0.3)',
                      }
                    }}
                  >
                    Open Notebook
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default NotebooksPage;