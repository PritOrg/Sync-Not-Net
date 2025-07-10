import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Chip
} from '@mui/material';
import {
  RocketLaunch,
  Groups,
  Security,
  Speed,
  Edit,
  Share,
  ArrowForward,
  PlayArrow
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ModernLandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Check for existing token and redirect to notebooks if valid
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Simple token validation - check if it's not expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp > currentTime) {
          // Token is valid, redirect to notebooks
          navigate('/notebooks');
          return;
        } else {
          // Token is expired, remove it
          localStorage.removeItem('token');
        }
      } catch (error) {
        // Invalid token format, remove it
        localStorage.removeItem('token');
      }
    }
  }, [navigate]);

  const features = [
    {
      icon: Groups,
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with live editing, presence indicators, and instant updates.'
    },
    {
      icon: Security,
      title: 'Enterprise Security',
      description: 'Keep your data safe with end-to-end encryption and advanced security controls.'
    },
    {
      icon: Speed,
      title: 'Lightning Fast',
      description: 'Experience blazing-fast performance with optimized real-time synchronization.'
    },
    {
      icon: Edit,
      title: 'Rich Text Editor',
      description: 'Create beautiful documents with our intuitive WYSIWYG editor and formatting tools.'
    },
    {
      icon: Share,
      title: 'Smart Sharing',
      description: 'Share notes with custom permissions, password protection, and access controls.'
    },
    {
      icon: RocketLaunch,
      title: 'Easy to Use',
      description: 'Get started in seconds with our intuitive interface and seamless onboarding.'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Notes Created' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px'
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Chip
                  label="✨ New: Real-time collaboration features"
                  sx={{
                    mb: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2
                  }}
                >
                  Collaborate in
                  <Box component="span" sx={{ color: theme.palette.secondary.main }}>
                    {' '}Real-time
                  </Box>
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 400,
                    lineHeight: 1.5
                  }}
                >
                  The modern note-taking platform that brings teams together. 
                  Create, share, and collaborate on documents in real-time.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    component={Link}
                    to="/auth?mode=login"
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    endIcon={<ArrowForward />}
                  >
                    Get Started Free
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    startIcon={<PlayArrow />}
                  >
                    Watch Demo
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                    alt="Team collaboration"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, backgroundColor: theme.palette.grey[50] }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: theme.palette.primary.main,
                        mb: 1
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Everything you need to collaborate
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 400
              }}
            >
              Powerful features designed to make team collaboration seamless and productive
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          backgroundColor: `${theme.palette.primary.main}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3
                        }}
                      >
                        <feature.icon
                          sx={{
                            fontSize: 30,
                            color: theme.palette.primary.main
                          }}
                        />
                      </Box>
                      
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          color: theme.palette.text.primary
                        }}
                      >
                        {feature.title}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          lineHeight: 1.6
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Quick Start Tips Section */}
      <Box sx={{ py: 8, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 2,
                textAlign: 'center'
              }}
            >
              Get Started in 3 Easy Steps
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: 'center',
                mb: 6,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Everything you need to know to start collaborating on notebooks immediately
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      border: `2px solid ${theme.palette.primary.main}`,
                      position: 'relative'
                    }}
                  >
                    <Chip
                      label="Step 1"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600
                      }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
                        🚀 Create or Join
                      </Typography>
                      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Start a new notebook or join an existing one with a shared link
                      </Typography>
                      <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.info.dark }}>
                          💡 Pro Tip: Use "Create New" for your own projects, or paste a shared link to collaborate!
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      border: `2px solid ${theme.palette.success.main}`,
                      position: 'relative'
                    }}
                  >
                    <Chip
                      label="Step 2"
                      color="success"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600
                      }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: theme.palette.success.main }}>
                        ✏️ Choose Your Mode
                      </Typography>
                      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Switch between Rich Text for notes and Code Mode for programming
                      </Typography>
                      <Box sx={{ bgcolor: '#e8f5e8', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.success.dark }}>
                          🎯 Quick Tip: Use Ctrl+S to save, Alt+Shift+F to format code!
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      border: `2px solid ${theme.palette.warning.main}`,
                      position: 'relative'
                    }}
                  >
                    <Chip
                      label="Step 3"
                      color="warning"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600
                      }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: theme.palette.warning.main }}>
                        🤝 Share & Collaborate
                      </Typography>
                      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Invite others with custom permissions and watch changes in real-time
                      </Typography>
                      <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.warning.dark }}>
                          🔒 Security: Set passwords and permissions to control access levels!
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>

            {/* Additional Tips */}
            <Box sx={{ mt: 6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}>
                🎓 Pro Tips for Power Users
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 1 }}>
                      ⌨️ Keyboard Shortcuts
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Ctrl+S (Save) • F11 (Fullscreen) • Ctrl+Z/Y (Undo/Redo) • Alt+Shift+F (Format Code)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 1 }}>
                      🔄 Auto-Save Magic
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Enable auto-save to never lose your work. Changes sync instantly across all devices!
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
          position: 'relative'
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: theme.palette.text.primary
                }}
              >
                Ready to transform your team's collaboration?
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 4,
                  fontWeight: 400
                }}
              >
                Join thousands of teams already using Sync Note Net to work better together
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  to="/auth?mode=login"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  endIcon={<ArrowForward />}
                >
                  Start Free Today
                </Button>

                <Button
                  component={Link}
                  to="/auth?mode=login"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main,
                      color: 'white'
                    }
                  }}
                >
                  Sign In
                </Button>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 3,
                  color: theme.palette.text.secondary
                }}
              >
                No credit card required • Free forever plan available
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default ModernLandingPage;
