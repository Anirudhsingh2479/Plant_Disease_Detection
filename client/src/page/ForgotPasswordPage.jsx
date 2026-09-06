import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [devResetLink, setDevResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    setDevResetLink('');

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      setSuccessMessage(response.data?.message || 'Password reset link sent to your email.');

      if (response.data?.devResetLink) {
        setDevResetLink(response.data.devResetLink);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
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
        onClick={() => navigate('/login')}
        sx={{ position: 'absolute', top: 24, left: 24, color: '#2e7d32', fontWeight: 700 }}
      >
        Back to Login
      </Button>

      <Paper 
        elevation={0}
        sx={{ 
          maxWidth: 420, 
          width: '100%', 
          p: 4, 
          borderRadius: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}
      >
        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', backgroundColor: 'rgba(46, 125, 50, 0.1)', mb: 2 }}>
          <LockResetIcon sx={{ fontSize: 36, color: '#2e7d32' }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>
          Forgot Password?
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Enter your registered email address and we will send you a link to reset your password.
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, textAlign: 'left', borderRadius: 3 }}>
            {successMessage}
          </Alert>
        )}

        {devResetLink && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left', borderRadius: 3, wordBreak: 'break-all' }}>
            <strong>Dev Verification Link:</strong>{' '}
            <a href={devResetLink} style={{ color: '#2e7d32', fontWeight: 'bold' }}>
              Click here to Reset Password
            </a>
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Email Address"
              name="email"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
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
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" sx={{ color: '#64748b', mt: 3 }}>
          Remembered your password?{' '}
          <span 
            onClick={() => navigate('/login')}
            style={{ color: '#2e7d32', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign In
          </span>
        </Typography>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
