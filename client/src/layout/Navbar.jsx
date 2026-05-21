import React from 'react';
import { AppBar, Toolbar, Typography, Button, Stack } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (id) => {
    // If user is not on the landing page, navigate home first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait a split second for the DOM to render, then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // If already home, just smooth scroll
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 'lg', width: '100%', mx: 'auto' }}>
        {/* Brand Logo */}
        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          sx={{ cursor: 'pointer' }} 
          onClick={() => handleNavigation('home-section')}
        >
          <SpaIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #1b5e20, #4caf50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KrishiMitra AI
          </Typography>
        </Stack>

        {/* Links and Actions */}
        <Stack direction="row" spacing={3} alignItems="center">
          <Button onClick={() => handleNavigation('home-section')} sx={{ color: '#334155', fontWeight: 600 }}>Home</Button>
          <Button onClick={() => handleNavigation('demo-section')} sx={{ color: '#334155', fontWeight: 600 }}>Live Scanner</Button>
          <Button onClick={() => handleNavigation('metrics-section')} sx={{ color: '#334155', fontWeight: 600 }}>Metrics</Button>
          
          {/* Action Button: Sign In / Access App */}
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')} // Redirects to our clean /login route
            sx={{ 
              backgroundColor: '#2e7d32', 
              fontWeight: 700,
              borderRadius: 3,
              px: 3,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)',
              '&:hover': { backgroundColor: '#1b5e20' }
            }}
          >
            Sign In
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;