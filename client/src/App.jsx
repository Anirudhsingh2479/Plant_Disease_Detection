import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LandingPage from './page/LandingPage';
import AuthPage from './page/AuthPage';
import VerifyEmailPage from './page/VerifyEmailPage';
import ForgotPasswordPage from './page/ForgotPasswordPage';
import ResetPasswordPage from './page/ResetPasswordPage';
import ProfilePage from './page/ProfilePage';
import DashboardPage from './page/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { checkAuth } from './redux/slices/authSlice';
import './App.css';

let theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

theme = responsiveFontSizes(theme);

const PublicRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, authChecked, isLoading } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
    }
  }, [authChecked, dispatch]);

  if (!authChecked || isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#2e7d32' }} />
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      
      <Router>
        <Routes>
          <Route
            path="/"
            element={(
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            )}
          />
          
          <Route
            path="/login"
            element={(
              <PublicRoute>
                <AuthPage initialMode="login" />
              </PublicRoute>
            )}
          />
          <Route
            path="/signup"
            element={(
              <PublicRoute>
                <AuthPage initialMode="signup" />
              </PublicRoute>
            )}
          />
          <Route
            path="/verify-email"
            element={(
              <PublicRoute>
                <VerifyEmailPage />
              </PublicRoute>
            )}
          />

          <Route
            path="/forgot-password"
            element={(
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            )}
          />
          <Route
            path="/reset-password"
            element={(
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            )}
          />

          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </Router>
      
    </ThemeProvider>
  );
}

export default App;
