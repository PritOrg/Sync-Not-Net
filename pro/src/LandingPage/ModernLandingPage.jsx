import React, { useEffect, useRef } from 'react';
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
  alpha,
  Chip,
  Avatar,
  Stack,
  IconButton,
} from '@mui/material';
import {
  RocketLaunch,
  Groups,
  Security,
  Speed,
  Edit,
  Share,
  ArrowForward,
  PlayArrow,
  GitHub,
  Twitter,
  LinkedIn,
  KeyboardArrowDown,
  Code,
  CloudSync,
  Lock,
  AutoAwesome,
  Bolt,
  Star,
} from '@mui/icons-material';
import { motion, useInView, useAnimation } from 'framer-motion';

// Animated section wrapper
const AnimatedSection = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, color, index }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card
        sx={{
          height: '100%',
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 20px 40px ${alpha(color || theme.palette.primary.main, 0.15)}`,
            borderColor: alpha(color || theme.palette.primary.main, 0.3),
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: alpha(color || theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Icon sx={{ fontSize: 28, color: color || theme.palette.primary.main }} />
          </Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Stat card component
const StatCard = ({ number, label, icon: Icon }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 3,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {Icon && (
          <Icon sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
        )}
        <Typography variant="h3" fontWeight={800} color="primary.main">
          {number}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
    </motion.div>
  );
};

const ModernLandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Check for existing token and redirect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp > currentTime) {
          navigate('/notebooks');
          return;
        }
        localStorage.removeItem('token');
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, [navigate]);

  const features = [
    {
      icon: Groups,
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with live editing, presence indicators, and instant sync across all devices.',
      color: '#6366f1',
    },
    {
      icon: Code,
      title: 'Code & Rich Text',
      description: 'Switch between code editor and rich text editor. Support for 20+ programming languages with syntax highlighting.',
      color: '#8b5cf6',
    },
    {
      icon: CloudSync,
      title: 'Auto-Save & Sync',
      description: 'Never lose your work. Automatic saving with version history to track all your changes.',
      color: '#06b6d4',
    },
    {
      icon: Lock,
      title: 'Secure Sharing',
      description: 'Share notebooks with password protection, QR codes, and granular permission controls.',
      color: '#10b981',
    },
    {
      icon: Bolt,
      title: 'Lightning Fast',
      description: 'Built for speed with optimized performance. No lag, no waiting - just pure productivity.',
      color: '#f59e0b',
    },
    {
      icon: AutoAwesome,
      title: 'Smart Features',
      description: 'Intelligent auto-completion, formatting assistance, and keyboard shortcuts for power users.',
      color: '#ec4899',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Users', icon: Groups },
    { number: '50K+', label: 'Notes Created', icon: Edit },
    { number: '99.9%', label: 'Uptime', icon: CloudSync },
    { number: '4.9', label: 'User Rating', icon: Star },
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>
                SyncNote
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                to="/auth?mode=login"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to="/auth?mode=register"
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                Get Started Free
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          pt: 10,
          pb: 8,
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 100%)`,
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 70%)`,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: 16 }} />}
                  label="New: Real-time collaboration"
                  sx={{
                    mb: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: theme.palette.primary.main },
                  }}
                />
                
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: 1.1,
                    mb: 3,
                  }}
                >
                  Collaborate on
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'block',
                    }}
                  >
                    notes & code
                  </Box>
                  in real-time
                </Typography>
                
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 4, fontWeight: 400, maxWidth: 500, lineHeight: 1.7 }}
                >
                  The modern notebook for teams who think together. Write, code, and collaborate
                  seamlessly with real-time sync and powerful editing tools.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    component={Link}
                    to="/auth?mode=register"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      px: 4,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Start Writing Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrow />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      px: 4,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2 },
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>

                {/* Social proof */}
                <Box sx={{ mt: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Stack direction="row" spacing={-1}>
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar
                        key={i}
                        sx={{
                          width: 36,
                          height: 36,
                          border: `2px solid ${theme.palette.background.paper}`,
                          bgcolor: `hsl(${i * 60}, 70%, 50%)`,
                          fontSize: '0.875rem',
                        }}
                      >
                        {String.fromCharCode(64 + i)}
                      </Avatar>
                    ))}
                  </Stack>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      10,000+ users
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      trust SyncNote for their notes
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {/* Hero image/mockup */}
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  {/* Mock editor header */}
                  <Box
                    sx={{
                      bgcolor: '#1e293b',
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22c55e' }} />
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'inline-block',
                          bgcolor: '#334155',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                        }}
                      >
                        my-notebook
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Mock editor content */}
                  <Box
                    sx={{
                      bgcolor: '#ffffff',
                      p: 3,
                      minHeight: 300,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* Sidebar */}
                      <Box
                        sx={{
                          width: 200,
                          bgcolor: '#f8fafc',
                          borderRadius: 2,
                          p: 2,
                          display: { xs: 'none', md: 'block' },
                        }}
                      >
                        {[1, 2, 3].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              height: 32,
                              bgcolor: i === 1 ? alpha('#6366f1', 0.1) : 'transparent',
                              borderRadius: 1,
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              px: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: i === 1 ? '#6366f1' : '#e2e8f0',
                                mr: 1,
                              }}
                            />
                            <Box
                              sx={{
                                width: '60%',
                                height: 8,
                                bgcolor: i === 1 ? '#6366f1' : '#e2e8f0',
                                borderRadius: 4,
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                      
                      {/* Content area */}
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            height: 24,
                            width: '70%',
                            bgcolor: '#1e293b',
                            borderRadius: 1,
                            mb: 2,
                          }}
                        />
                        <Box
                          sx={{
                            height: 12,
                            width: '100%',
                            bgcolor: '#e2e8f0',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        />
                        <Box
                          sx={{
                            height: 12,
                            width: '90%',
                            bgcolor: '#e2e8f0',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        />
                        <Box
                          sx={{
                            height: 12,
                            width: '95%',
                            bgcolor: '#e2e8f0',
                            borderRadius: 1,
                            mb: 3,
                          }}
                        />
                        <Box
                          sx={{
                            height: 80,
                            width: '100%',
                            bgcolor: '#f1f5f9',
                            borderRadius: 2,
                            border: '1px dashed #cbd5e1',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 8, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <StatCard {...stat} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip
                label="Features"
                sx={{
                  mb: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              />
              <Typography variant="h2" fontWeight={700} gutterBottom>
                Everything you need
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Powerful features designed to help you write better, collaborate faster,
                and stay organized.
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard {...feature} index={index} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <Box
              sx={{
                textAlign: 'center',
                p: 6,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -100,
                  right: -100,
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -50,
                  left: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                }}
              />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Ready to get started?
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}>
                  Join thousands of teams already using SyncNote
                </Typography>
                <Button
                  component={Link}
                  to="/auth?mode=register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: 'white',
                    color: '#6366f1',
                    borderRadius: 3,
                    py: 1.5,
                    px: 5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Create Free Account
                </Button>
              </Box>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 6,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: alpha(theme.palette.background.default, 0.5),
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  SyncNote
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                The modern notebook for teams who think together.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <GitHub />
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Twitter />
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <LinkedIn />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4, textAlign: 'center' }}>
            © 2026 SyncNote. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default ModernLandingPage;