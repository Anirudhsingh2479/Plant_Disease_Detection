import React from 'react';
import { Container, Grid, Box, Alert } from '@mui/material';
import Navbar from '../layout/Navbar';
import HeroSection from '../components/landing/HeroSection';
import LiveDemo from '../components/landing/LiveDemo'; 
import ReportCard from '../components/landing/ReportCard';
import HowItWorks from '../components/landing/HowItWorks';
import AnimatedBackground from '../components/landing/AnimatedBackground';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  return (
    <Box id="home-section" sx={{ background: '#f9fafb', minHeight: '100vh', position: 'relative' }}>
      
      <AnimatedBackground />
      <Navbar />

      <Box sx={{ pt: { xs: '56px', sm: '64px' }, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg" sx={{ p: 0 }}>
          <Alert severity="info" sx={{ m: 0 }}>
            Chatbot usage is enabled after login.
          </Alert>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pt: 6, pb: 10, position: 'relative', zIndex: 1 }}>
        
        {/* Force a min-height to ensure the container isn't collapsing */}
        <Grid container spacing={4} alignItems="flex-start" id="demo-section" sx={{ mb: 15 }}>
          
          {/* LEFT: Hero Text */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <HeroSection />
            </Box>
          </Grid>
          
          {/* RIGHT: Live Scanner */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3 }}>
              <LiveDemo />
            </Box>
          </Grid>
        </Grid>

        <Box id="metrics-section" sx={{ mb: 15 }}>
          <ReportCard />
        </Box>

        <Box id="how-it-works-section">
          <HowItWorks />
        </Box>

      </Container>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Footer />
      </Box>
      
    </Box>
  );
};

export default LandingPage;