import { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack, Checkbox, FormControlLabel, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser } from '../redux/slices/authSlice.js'; // Ensure path is correct

const AuthPage = ({ initialMode = "login" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, user } = useSelector((state) => state.auth || {});
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if(user){
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSignUp(initialMode === "signup");
    setFormData({ name: '', email: '', password: '' });
    setShowPassword(false);
  }, [initialMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(isSignUp){
      try {
        // Use .unwrap() to catch the success directly in the component
        const result = await dispatch(registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })).unwrap();

        if (result?.devVerificationLink) {
          window.location.href = result.devVerificationLink;
          return;
        }
        
        // On success: clear form, switch to login mode, and navigate
        setFormData({ name: '', email: '', password: '' });
        setIsSignUp(false);
        navigate('/login');
        
      } catch (err) {
        // Errors are already handled by Redux state, but you can add local logic here if needed
        console.error("Signup failed", err);
      }
    }
    else {
      // UPDATED LOGIN LOGIC
      try {
        await dispatch(loginUser({
          email: formData.email,
          password: formData.password,
        })).unwrap();

        navigate('/dashboard');
      } catch (err) {
        console.error("Login failed:", err);
      }
    }
  };

 return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 2,
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        position: 'relative'
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ position: 'absolute', top: 24, left: 24, color: '#2e7d32', fontWeight: 700 }}
      >
        Back to Home
      </Button>

      <Paper 
        elevation={0}
        sx={{ 
          maxWidth: 420, 
          width: '100%', 
          p: 4, 
          borderRadius: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
          {isSignUp ? "Join us to save your crop history updates" : "Access your local plant remedy tracking dashboard"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {isSignUp && (
              <TextField
                label="Full Name"
                name="name"
                autoComplete="name"
                variant="outlined"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            )}
            
            <TextField
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              variant="outlined"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            
            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              variant="outlined"
              fullWidth
              required
              value={formData.password}
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: -1.5 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={showPassword} 
                    onChange={(e) => setShowPassword(e.target.checked)} 
                    sx={{
                      color: '#2e7d32',
                      '&.Mui-checked': { color: '#2e7d32' },
                    }}
                  />
                }
                label={<Typography variant="body2" sx={{ color: '#64748b' }}>Show Password</Typography>}
              />
            </Box>

            {/* 4. Display Redux Errors gracefully */}
            {error && (
              <Typography color="error" variant="body2" sx={{ textAlign: 'left', mt: -1 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading} // Disable while loading
              sx={{
                backgroundColor: '#2e7d32',
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)',
                '&:hover': { backgroundColor: '#1b5e20' }
              }}
            >
              {/* 5. Show Spinner or Text based on loading state */}
              {isLoading ? <CircularProgress size={24} color="inherit" /> : (isSignUp ? "Sign Up" : "Sign In")}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" sx={{ color: '#64748b', mt: 4 }}>
          {isSignUp ? "Already have an account? " : "New to KrishiMitra? "}
          <span 
            onClick={() => {
              setFormData({ name: '', email: '', password: '' });
              setIsSignUp(!isSignUp);
              navigate(isSignUp ? '/login' : '/signup');
            }} 
            style={{ color: '#2e7d32', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? "Sign In" : "Create one"}
          </span>
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthPage;
