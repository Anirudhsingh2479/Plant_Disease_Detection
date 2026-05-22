import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: 'white', pt: 6, pb: 3, borderTop: '1px solid #e5e7eb' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          
          {/* Brand & Description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SpaIcon sx={{ color: '#10b981', fontSize: 32, mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                PlantCareAI
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Empowering farmers and plant enthusiasts with cutting-edge computer vision to instantly diagnose and treat plant diseases.
            </Typography>
          </Grid>

          {/* Quick Links */}
         <Grid item xs={12} sm={4} md={2}>
  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
    Product
  </Typography>
  
  {/* This Box controls the vertical layout and the spacing between the links */}
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Link href="#home-section" underline="hover" color="text.secondary">Home</Link>
    <Link href="#demo-section" underline="hover" color="text.secondary">Live Demo</Link>
    <Link href="#metrics-section" underline="hover" color="text.secondary">Metrics</Link>
    <Link href="#how-it-works-section" underline="hover" color="text.secondary">How it Works</Link>
  </Box>
</Grid>

          {/* Legal */}
          <Grid item xs={12} sm={4} md={2}>
  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
    Legal
  </Typography>
  
  {/* This Box handles the vertical layout and the spacing between the links */}
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Link href="#" underline="hover" color="text.secondary">
      Privacy Policy
    </Link>
    <Link href="#" underline="hover" color="text.secondary">
      Terms of Service
    </Link>
  </Box>
</Grid>

          {/* Social Icons */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Connect with us
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, ml: -1 }}>
              <IconButton aria-label="github" color="inherit" sx={{ color: 'text.secondary', '&:hover': { color: '#10b981' } }}>
                <GitHubIcon />
              </IconButton>
              <IconButton aria-label="twitter" color="inherit" sx={{ color: 'text.secondary', '&:hover': { color: '#10b981' } }}>
                <TwitterIcon />
              </IconButton>
              <IconButton aria-label="linkedin" color="inherit" sx={{ color: 'text.secondary', '&:hover': { color: '#10b981' } }}>
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Copyright */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} PlantCareAI. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;