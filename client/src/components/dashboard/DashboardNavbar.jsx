import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';
import SpaIcon from '@mui/icons-material/Spa';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageSelector from '../common/LanguageSelector';

const DashboardNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const initial = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <AppBar 
      position="static" 
      sx={{
        background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
        boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(46, 125, 50, 0.2)'
      }}
    >
      <Toolbar sx={{ py: 1.5 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            cursor: 'pointer',
            flexGrow: 1
          }}
          onClick={() => navigate('/dashboard')}
        >
          <SpaIcon sx={{ fontSize: 28, color: '#fff' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: '800',
              fontSize: '1.25rem',
              letterSpacing: '-0.5px',
              color: '#fff'
            }}
          >
            PlantCare AI
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Language Switcher Dropdown */}
          <LanguageSelector />

          <Button
            onClick={() => navigate('/profile')}
            startIcon={
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#fff'
                }}
              >
                {initial}
              </Avatar>
            }
            sx={{
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              borderRadius: 3,
              px: 1.5
            }}
          >
            Profile
          </Button>

          <Button 
            color="inherit" 
            variant="outlined"
            endIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardNavbar;
