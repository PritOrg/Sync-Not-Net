import { useState, useEffect } from 'react';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  TextField,
  Card,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Avatar
} from '@mui/material';
import { 
  BookOpen, 
  Lock, 
  Edit3, 
  Zap, 
  Users, 
  History, 
  FileText,
  Code,
  Share2,
  Shield,
  Globe,
  Coffee
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, desc, delay }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <Card
        sx={{
          p: 4,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[8],
            bgcolor: alpha(theme.palette.primary.main, 0.05)
          }
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            mb: 3
          }}
        >
          <Icon size={32} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {desc}
        </Typography>
      </Card>
    </motion.div>
  );
};

const LiveDemo = () => {
  const [demoText, setDemoText] = useState('');
  const collaborators = ['Alice', 'Bob', 'Charlie'];

  useEffect(() => {
    const texts = [
      'Welcome to Sync Note Net...',
      'Real-time collaboration in action...',
      'Multiple users can edit simultaneously...'
    ];
    let i = 0;
    
    const interval = setInterval(() => {
      setDemoText(texts[i]);
      i = (i + 1) % texts.length;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      sx={{
        p: 3,
        maxWidth: '600px',
        mx: 'auto',
        mt: 6,
        mb: 8,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }}>
        {collaborators.map((user, index) => (
          <Tooltip key={user} title={`${user} is online`}>
            <Avatar
              sx={{
                bgcolor: `hsl(${index * 120}, 70%, 60%)`,
                border: '2px solid white'
              }}
            >
              {user[0]}
            </Avatar>
          </Tooltip>
        ))}
      </Box>
      <Typography variant="body1" sx={{ minHeight: '100px' }}>
        {demoText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          |
        </motion.span>
      </Typography>
    </Card>
  );
};

export default function LandingPage() {
  const theme = useTheme();
  const features = [
    { 
      icon: Lock, 
      title: "Advanced Security", 
      desc: "Password-protected notebooks with end-to-end encryption for maximum security." 
    },
    { 
      icon: Edit3, 
      title: "Rich Text Editor", 
      desc: "Feature-rich WYSIWYG editor with support for images, tables, and formatting." 
    },
    { 
      icon: Code, 
      title: "Code Editor", 
      desc: "Dedicated code editor with syntax highlighting and multiple language support." 
    },
    { 
      icon: Zap, 
      title: "Real-time Collaboration", 
      desc: "See changes instantly as your team works together, with live cursors and presence." 
    },
    { 
      icon: Shield, 
      title: "Access Control", 
      desc: "Granular permissions and role-based access control for teams." 
    },
    { 
      icon: Globe, 
      title: "Cross-Platform", 
      desc: "Access your notes from any device, anywhere, anytime." 
    }
  ];

  return (
    <main>
      {/* Hero Section */}
      <Box 
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Container sx={{ py: { xs: 12, md: 20 } }}>
            <Box maxWidth="800px" mx="auto" textAlign="center">
              <Typography 
                variant="h2" 
                fontWeight="800" 
                mb={3}
                sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  letterSpacing: '-0.02em'
                }}
              >
                Collaborate and Create Together in Real-Time
              </Typography>
              <Typography variant="h5" mb={6} fontWeight="normal">
                The next-generation collaborative note-taking platform for teams
              </Typography>
              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  component={Link}
                  to="/SigninSignup"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.9)
                    }
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: alpha(theme.palette.common.white, 0.9),
                      bgcolor: alpha(theme.palette.common.white, 0.1)
                    }
                  }}
                >
                  Watch Demo
                </Button>
              </Box>
            </Box>
          </Container>
        </motion.div>
      </Box>

      {/* Live Demo Section */}
      <LiveDemo />

      {/* Features Section */}
      <Box py={{ xs: 8, md: 12 }} bgcolor="grey.50">
        <Container>
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            textAlign="center" 
            mb={8}
            sx={{ letterSpacing: '-0.02em' }}
          >
            Everything You Need to Create and Collaborate
          </Typography>
          <Box 
            display="grid" 
            gap={4}
            gridTemplateColumns={{ 
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)' 
            }}
          >
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                {...feature} 
                delay={index * 0.1}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        py={{ xs: 8, md: 12 }} 
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`
        }}
      >
        <Container maxWidth="md">
          <Box 
            textAlign="center" 
            p={6} 
            borderRadius={4}
            bgcolor="white"
            boxShadow={theme.shadows[4]}
          >
            <Typography variant="h4" fontWeight="bold" mb={3}>
              Start Collaborating Today
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={4}>
              Join thousands of teams already using Sync Note Net
            </Typography>
            <Box 
              component="form" 
              display="flex" 
              gap={2} 
              maxWidth="500px" 
              mx="auto"
              flexDirection={{ xs: 'column', sm: 'row' }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter your work email"
                sx={{ bgcolor: 'white' }}
              />
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  px: 4,
                  whiteSpace: 'nowrap'
                }}
              >
                Start Free Trial
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" mt={2} display="block">
              No credit card required · 14-day free trial · Cancel anytime
            </Typography>
          </Box>
        </Container>
      </Box>
    </main>
  );
}