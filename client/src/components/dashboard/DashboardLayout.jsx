import React from 'react';
import { Box } from '@mui/material';
import DashboardNavbar from './DashboardNavbar';
import DashboardFooter from './DashboardFooter';

const DashboardLayout = ({ children }) => {
  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh', // Ensures the layout takes up the full screen height
      }}
    >
      <DashboardNavbar />
      
      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, // Allows this section to expand and push the footer down
          p: 3, 
          maxWidth: '1200px', 
          margin: '0 auto', 
          width: '100%' 
        }}
      >
        {children}
      </Box>

      <DashboardFooter />
    </Box>
  );
};

export default DashboardLayout;