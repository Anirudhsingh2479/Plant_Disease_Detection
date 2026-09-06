import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AnalyticsIcon from '@mui/icons-material/Analytics';

import { updateProfileThunk, changePasswordThunk, logoutUser } from '../redux/slices/authSlice';
import axiosInstance from '../api/axiosInstance';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const [name, setName] = useState(user?.name || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [stats, setStats] = useState({ total: 0, healthy: 0, infected: 0 });
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const fetchHistoryStats = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await axiosInstance.get('/diagnosis/history');
        const history = Array.isArray(response.data) ? response.data : response.data?.history || [];
        setHistoryList(history);

        const total = history.length;
        const healthy = history.filter((item) => String(item.diseaseName || '').toLowerCase().includes('healthy')).length;
        const infected = total - healthy;
        setStats({ total, healthy, infected });
      } catch {
        // Fallback stats if history request fails
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistoryStats();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      await dispatch(updateProfileThunk({ name: name.trim() })).unwrap();
      setProfileSuccess('Profile name updated successfully!');
    } catch (err) {
      setProfileError(err || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      await dispatch(changePasswordThunk({ currentPassword, newPassword })).unwrap();
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
  };

  const getInitials = (userName) => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="lg">
        {/* Navigation Top Bar */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'none' }}
          >
            Back to Dashboard
          </Button>

          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            color="error"
            variant="outlined"
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, px: 2, py: 0.75 }}
          >
            Sign Out
          </Button>
        </Box>

        {/* Profile Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: { xs: 72, sm: 88 },
                height: { xs: 72, sm: 88 },
                backgroundColor: '#ffffff',
                color: '#2e7d32',
                fontSize: { xs: '1.8rem', sm: '2.2rem' },
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              {getInitials(user?.name)}
            </Avatar>

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.1rem' } }}>
                  {user?.name || 'User Profile'}
                </Typography>
                {user?.isVerified && (
                  <Chip
                    icon={<VerifiedUserIcon style={{ color: '#ffffff' }} />}
                    label="Verified Account"
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', fontWeight: 600 }}
                  />
                )}
              </Box>

              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                {user?.email}
              </Typography>

              {user?.createdAt && (
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                  Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* 1. THREE ANALYSIS PANELS (SIDE BY SIDE IN 1 ROW ON TABLET & DESKTOP) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 36, color: '#2e7d32', mb: 1 }} />
            <Typography variant="h4" fontWeight="800" color="#1e293b">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Plant Diagnoses
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 36, color: '#16a34a', mb: 1 }} />
            <Typography variant="h4" fontWeight="800" color="#16a34a">
              {stats.healthy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Healthy Plant Scans
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <WarningAmberIcon sx={{ fontSize: 36, color: '#dc2626', mb: 1 }} />
            <Typography variant="h4" fontWeight="800" color="#dc2626">
              {stats.infected}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Infected Crop Diagnoses
            </Typography>
          </Paper>
        </Box>

        {/* 2. ACCOUNT DETAILS & SECURITY CARDS (SIDE BY SIDE 50%/50% MID-WIDTH) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            mb: 4,
          }}
        >
          {/* Edit Profile */}
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <PersonOutlinedIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="700">
                Account Details
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {profileSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{profileSuccess}</Alert>}
            {profileError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{profileError}</Alert>}

            <form onSubmit={handleUpdateProfile}>
              <Stack spacing={2.5}>
                <TextField
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <TextField
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  disabled
                  value={user?.email || ''}
                  helperText="Email address cannot be changed."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isUpdatingProfile}
                  sx={{
                    backgroundColor: '#2e7d32',
                    py: 1.25,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#1b5e20' }
                  }}
                >
                  {isUpdatingProfile ? <CircularProgress size={22} color="inherit" /> : 'Save Profile Changes'}
                </Button>
              </Stack>
            </form>
          </Paper>

          {/* Change Password */}
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <SecurityIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="700">
                Security & Password
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {passwordSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{passwordSuccess}</Alert>}
            {passwordError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{passwordError}</Alert>}

            <form onSubmit={handleChangePassword}>
              <Stack spacing={2.5}>
                <TextField
                  label="Current Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <TextField
                  label="New Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isChangingPassword}
                  sx={{
                    backgroundColor: '#2e7d32',
                    py: 1.25,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#1b5e20' }
                  }}
                >
                  {isChangingPassword ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Box>

        {/* 3. RECENT PLANT ANALYSIS RECORDS GALLERY (3 COLUMNS) */}
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AnalyticsIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="700">
                Recent Plant Analysis Records
              </Typography>
            </Box>
            <Button
              onClick={() => navigate('/dashboard')}
              sx={{ color: '#2e7d32', fontWeight: 600, textTransform: 'none' }}
            >
              View Full Dashboard
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {isLoadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#2e7d32' }} />
            </Box>
          ) : historyList.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No plant diagnosis records found yet. Upload a leaf image on the dashboard to view analysis history here!
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              {historyList.slice(0, 6).map((item, index) => {
                const isHealthy = String(item.diseaseName || '').toLowerCase().includes('healthy');
                const confidence = Number(item.confidence || 0);
                const confidenceStr = confidence > 1 ? confidence.toFixed(1) : (confidence * 100).toFixed(1);

                return (
                  <Card
                    key={item._id || index}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.06)',
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', height: 180, backgroundColor: '#f1f5f9' }}>
                      {item.imageUrl ? (
                        <CardMedia
                          component="img"
                          height="180"
                          image={item.imageUrl}
                          alt={item.diseaseName}
                          sx={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          No Image Available
                        </Box>
                      )}
                      <Chip
                        label={isHealthy ? 'Healthy' : 'Infected'}
                        color={isHealthy ? 'success' : 'error'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle1" fontWeight="700" noWrap sx={{ color: '#1e293b' }}>
                        {item.diseaseName || 'Plant Diagnosis'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {confidenceStr}% confidence
                        </Typography>
                        {item.createdAt && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage;
