import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Link, Button, IconButton, Menu, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SpaIcon from '@mui/icons-material/Spa';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  
  // Detects if the screen size is smaller than 'md' (tablet/mobile)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const navLinks = [
    { label: 'Home', href: '#home-section' },
    { label: 'How it Works', href: '#how-it-works-section' },
    { label: 'Metrics', href: '#metrics-section' },
  ];

  return (
    <AppBar 
      position="fixed" 
      elevation={0} 
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid #e5e7eb',
        color: 'text.primary' // Ensures icons match text color defaults
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 'lg', width: '100%', mx: 'auto' }}>
        
        {/* LOGO */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SpaIcon sx={{ color: '#10b981', mr: 1 }} />
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            PlantCareAI
          </Typography>
        </Box>

        {/* CONDITIONAL NAVIGATION */}
        {isMobile ? (
          // --- MOBILE VIEW: Hamburger Menu ---
          <Box>
            <IconButton edge="start" aria-label="menu" onClick={handleMenuOpen}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              keepMounted
              sx={{ '& .MuiPaper-root': { width: '220px', mt: 1, borderRadius: 2 } }}
            >
              {navLinks.map((link) => (
                <MenuItem 
                  key={link.label} 
                  component="a" 
                  href={link.href} 
                  onClick={handleMenuClose}
                  sx={{ 
                    color: 'text.secondary', 
                    textDecoration: 'none',
                    fontWeight: 500,
                    py: 1.5,
                    '&:hover': { color: '#10b981' } 
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
              <Box sx={{ p: 1.5 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  sx={{ 
                    backgroundColor: '#111827', 
                    borderRadius: 3, 
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#1f2937' }
                  }}
                >
                  Launch App
                </Button>
              </Box>
            </Menu>
          </Box>
        ) : (
          // --- DESKTOP VIEW: Horizontal Links ---
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                underline="none" 
                color="text.secondary" 
                sx={{ fontWeight: 500, '&:hover': { color: '#10b981' } }}
              >
                {link.label}
              </Link>
            ))}
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#111827', 
                borderRadius: 4, 
                px: 3, 
                textTransform: 'none', 
                fontWeight: 600,
                '&:hover': { backgroundColor: '#1f2937' } 
              }}
            >
              Launch App
            </Button>
          </Box>
        )}

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;