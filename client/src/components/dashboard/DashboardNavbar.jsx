import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice'; // Adjust path when ready

const DashboardNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  
  const handleLogout = () => {
    dispatch(logout()); // 4. This actually wipes the token from Redux & LocalStorage!
    navigate('/login'); // 5. Send them back to the login page safely
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }}
          onClick={() => navigate('/dashboard')}
        >
          PlantCare AI Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            Hello, User
          </Typography>
          <Button color="inherit" variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardNavbar;