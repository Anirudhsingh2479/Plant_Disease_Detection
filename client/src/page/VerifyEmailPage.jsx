import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmailToken } from '../redux/slices/authSlice';

const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRequestedRef = useRef(false);
  const { isLoading } = useSelector((state) => state.auth || {});
  const token = searchParams.get('token');
  const missingTokenMessage = 'Verification token is missing. Please use the link from your email.';
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;

    dispatch(verifyEmailToken(token))
      .unwrap()
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch((error_) => {
        setVerificationError(error_ || 'Email verification failed.');
      });
  }, [dispatch, navigate, token]);

  const errorMessage = verificationError || (token ? '' : missingTokenMessage);

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
          textAlign: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Verify Email
          </Typography>

          {!errorMessage && (
            <>
              <CircularProgress sx={{ color: '#2e7d32' }} />
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                {isLoading ? 'Verifying your email and signing you in...' : 'Preparing verification...'}
              </Typography>
            </>
          )}

          {errorMessage && (
            <>
              <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                {errorMessage}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/login', { replace: true })}
                sx={{
                  backgroundColor: '#2e7d32',
                  borderRadius: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#1b5e20' },
                }}
              >
                Go to Login
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;