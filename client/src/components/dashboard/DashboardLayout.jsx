import { Box } from '@mui/material';
import DashboardNavbar from './DashboardNavbar';
import DashboardFooter from './DashboardFooter';

const DashboardLayout = ({ children }) => {
  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f7eb 50%, #f0fdf4 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, rgba(46, 125, 50, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(46, 125, 50, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <DashboardNavbar />
        
        {/* Main Content Area */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            minHeight: 'calc(100vh - 140px)'
          }}
        >
          {children}
        </Box>
      </Box>

      <DashboardFooter />
    </Box>
  );
};

export default DashboardLayout;