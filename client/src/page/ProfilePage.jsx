import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
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
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: { xs: 2, sm: 4 }, width: '100%' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
        {/* Navigation Top Bar */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'none', px: 0 }}
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

        {/* Profile Banner Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            mb: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(46, 125, 50, 0.2)',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
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

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' } }}>
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

              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5, wordBreak: 'break-all' }}>
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

        {/* Stats Row */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3, width: '100%', m: 0 }}>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', width: '100%', pl: '0 !important', pt: { xs: 2, sm: 0 } }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', width: '100%', flex: 1 }}>
              <HistoryIcon sx={{ fontSize: { xs: 30, sm: 36 }, color: '#2e7d32', mb: 1 }} />
              <Typography variant="h4" fontWeight="800" color="#1e293b" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Plant Diagnoses
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4} sx={{ display: 'flex', width: '100%', pl: { xs: '0 !important', sm: '24px !important' }, pt: { xs: 2, sm: 0 } }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', width: '100%', flex: 1 }}>
              <CheckCircleIcon sx={{ fontSize: { xs: 30, sm: 36 }, color: '#16a34a', mb: 1 }} />
              <Typography variant="h4" fontWeight="800" color="#16a34a" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                {stats.healthy}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Healthy Plant Scans
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4} sx={{ display: 'flex', width: '100%', pl: { xs: '0 !important', sm: '24px !important' }, pt: { xs: 2, sm: 0 } }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', width: '100%', flex: 1 }}>
              <WarningAmberIcon sx={{ fontSize: { xs: 30, sm: 36 }, color: '#dc2626', mb: 1 }} />
              <Typography variant="h4" fontWeight="800" color="#dc2626" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
                {stats.infected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Infected Crop Diagnoses
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Profile Settings Cards */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 4, width: '100%', m: 0 }}>
          {/* Edit Profile */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', width: '100%', pl: '0 !important', pt: { xs: 2, md: 0 } }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4, border: '1px solid #e2e8f0', width: '100%', flex: 1 }}>
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
          </Grid>

          {/* Change Password */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', width: '100%', pl: { xs: '0 !important', md: '24px !important' }, pt: { xs: 2, md: 0 } }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4, border: '1px solid #e2e8f0', width: '100%', flex: 1 }}>
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
          </Grid>
        </Grid>

        {/* --- RECENT PLANT ANALYSIS & DIAGNOSIS HISTORY SECTION --- */}
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4, border: '1px solid #e2e8f0', width: '100%' }}>
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
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%', m: 0 }}>
              {historyList.slice(0, 6).map((item, index) => {
                const isHealthy = String(item.diseaseName || '').toLowerCase().includes('healthy');
                const confidence = Number(item.confidence || 0);
                const confidenceStr = confidence > 1 ? confidence.toFixed(1) : (confidence * 100).toFixed(1);

                return (
                  <Grid item xs={12} sm={6} md={4} key={item._id || index} sx={{ display: 'flex', width: '100%', p: '12px !important' }}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        width: '100%',
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
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage;
