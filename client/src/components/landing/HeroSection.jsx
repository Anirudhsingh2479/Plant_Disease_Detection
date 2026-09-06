import { Box, Typography, Button } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const HeroSection = () => {
  const scrollToSection = () => {
    const section = document.getElementById('demo-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      zIndex: 2, // Explicitly brought to the front
      bgcolor: 'rgba(255, 255, 255, 0.7)', // Added a semi-transparent background to ensure visibility
      p: 4, 
      borderRadius: 4,
      backdropFilter: 'blur(5px)'
    }}>
      <Typography variant="h2" component="h1" fontWeight="900" gutterBottom sx={{ color: '#111827', lineHeight: 1.2 }}>
        Diagnose Plant Diseases in <br/>
        <span style={{ color: '#2e7d32' }}>Seconds</span>.
      </Typography>
      
      <Typography variant="subtitle1" paragraph sx={{ fontSize: '1.25rem', color: '#374151', mb: 5 }}>
        Upload a photo of a crop leaf and let our custom ResNet50 AI instantly detect diseases. Protect your yield with cutting-edge computer vision.
      </Typography>
      
      <Button 
        onClick={scrollToSection}
        variant="contained" 
        color="success" 
        size="large" 
        startIcon={<SpaIcon />}
        endIcon={<ArrowForwardIcon />}
        sx={{ 
          py: 1.8, px: 4, fontSize: '1.1rem', borderRadius: 50, textTransform: 'none', fontWeight: 'bold',
          background: '#2e7d32',
          '&:hover': { background: '#1b5e20' }
        }}
      >
        Try the AI Engine
      </Button>
    </Box>
  );
};

export default HeroSection;
