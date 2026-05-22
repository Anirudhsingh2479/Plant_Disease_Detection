import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Keep your image import here!
import Plant_image from '../../assets/Plant_image1.png';

const LiveDemo = () => {
  return (
    // The main container is now a flex row
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, // Stacks on mobile, side-by-side on desktop
      gap: 3, 
      width: '100%',
      alignItems: 'stretch' // Makes both boxes the same height
    }}>
      
      {/* --- LEFT SIDE: THE LEAF IMAGE --- */}
      <Paper 
        elevation={8} 
        sx={{ 
          position: 'relative', 
          borderRadius: 4, 
          overflow: 'hidden',
          flex: 1, // Takes up equal space
          backgroundColor: '#1a1a1a',
          minHeight: '250px' // Ensures it doesn't collapse too small
        }}
      >
        <Box
          component="img"
          src={Plant_image}
          alt="Plant Disease Diagnosis"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />

        {/* The Diagnosis Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: '#ffdac7',
            color: '#5c2b18',
            padding: '6px 18px',
            borderRadius: '24px',
            fontWeight: 700,
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Tomato Late Blight */}
        </Box>
      </Paper>

      {/* --- RIGHT SIDE: DRAG & DROP ZONE --- */}
      <Paper 
        elevation={0} 
        sx={{ 
          border: '2px dashed #a7f3d0', 
          backgroundColor: 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(10px)',
          borderRadius: 4, 
          p: 4, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // Centers content vertically
          alignItems: 'center',     // Centers content horizontally
          flex: 1, // Takes up equal space
          textAlign: 'center', 
          transition: 'all 0.3s ease', 
          cursor: 'pointer',
          '&:hover': { borderColor: '#2e7d32', backgroundColor: 'rgba(255, 255, 255, 0.9)' }
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          Drag & Drop your leaf photo
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          High-res JPG or PNG (Max 5MB)
        </Typography>
        <Button variant="outlined" color="success" sx={{ mt: 2, borderRadius: 5, textTransform: 'none' }}>
          Browse Files
        </Button>
      </Paper>

    </Box>
  );
};

export default LiveDemo;