import React from 'react';
import { Box, Typography, Container, Grid, Link } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';

const DashboardFooter = () => {
  return (
    <Box 
      component="footer" 
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        background: 'rgba(46, 125, 50, 0.05)',
        borderTop: '1px solid rgba(46, 125, 50, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SpaIcon sx={{ color: '#2e7d32', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                PlantCare AI
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Advanced plant disease detection powered by AI.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
              Features
            </Typography>
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 0.5, color: '#666', '&:hover': { color: '#2e7d32' } }}>Instant Detection</Link>
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 0.5, color: '#666', '&:hover': { color: '#2e7d32' } }}>History Tracking</Link>
            <Link href="#" variant="body2" sx={{ display: 'block', color: '#666', '&:hover': { color: '#2e7d32' } }}>AI Analysis</Link>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
              Support
            </Typography>
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 0.5, color: '#666', '&:hover': { color: '#2e7d32' } }}>Help Center</Link>
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 0.5, color: '#666', '&:hover': { color: '#2e7d32' } }}>FAQ</Link>
            <Link href="#" variant="body2" sx={{ display: 'block', color: '#666', '&:hover': { color: '#2e7d32' } }}>Contact</Link>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
              Legal
            </Typography>
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 0.5, color: '#666', '&:hover': { color: '#2e7d32' } }}>Privacy Policy</Link>
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 0.5, color: '#666', '&:hover': { color: '#2e7d32' } }}>Terms of Service</Link>
            <Link href="#" variant="body2" sx={{ display: 'block', color: '#666', '&:hover': { color: '#2e7d32' } }}>Disclaimer</Link>
          </Grid>
        </Grid>
        
        <Box sx={{ borderTop: '1px solid rgba(46, 125, 50, 0.1)', pt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} PlantCare AI. All rights reserved. | Powered by ResNet50 Deep Learning
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardFooter;