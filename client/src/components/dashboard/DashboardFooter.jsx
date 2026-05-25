import React from 'react';
import { Box, Typography } from '@mui/material';

const DashboardFooter = () => {
  return (
    <Box 
      component="footer" 
      sx={{
        py: 3,
        px: 2,
        mt: 'auto', // Pushes footer to the bottom
        backgroundColor: '#f5f5f5',
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} PlantCare AI. All rights reserved.
      </Typography>
    </Box>
  );
};

export default DashboardFooter;