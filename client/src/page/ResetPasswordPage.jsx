import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack, Alert, Checkbox, FormControlLabel, CircularProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Reset token is missing from the URL.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
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
      }}
    >
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
        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', backgroundColor: isSuccess ? 'rgba(46, 125, 50, 0.1)' : 'rgba(30, 41, 59, 0.05)', mb: 2 }}>
          {isSuccess ? (
            <CheckCircleOutlinedIcon sx={{ fontSize: 36, color: '#2e7d32' }} />
          ) : (
            <LockOutlinedIcon sx={{ fontSize: 36, color: '#1e293b' }} />
          )}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>
          {isSuccess ? 'Password Reset!' : 'Set New Password'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          {isSuccess
            ? 'Your password has been successfully updated. Redirecting to login...'
            : 'Please enter your new password below.'}
        </Typography>

        {isSuccess && (
          <Alert severity="success" sx={{ mb: 3, textAlign: 'left', borderRadius: 3 }}>
            Password updated successfully! You can now log in with your new credentials.
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {!isSuccess && (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading || !token}
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
