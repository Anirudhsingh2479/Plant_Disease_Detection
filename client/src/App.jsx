import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from './page/LandingPage';
import AuthPage from './page/AuthPage'; // Added import
import VerifyEmailPage from './page/VerifyEmailPage';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './page/DashboardPage'; // Added import

// 1. Create your base Material UI theme
let theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// 2. Apply the "magic" responsive font sizes utility!
theme = responsiveFontSizes(theme);

function App() {
  return (
    // 3. Wrap your entire application (including the Router) in the ThemeProvider
    <ThemeProvider theme={theme}>
      {/* CssBaseline kicks in the theme's background colors and resets default browser margins */}
      <CssBaseline /> 
      
      <Router>
        <Routes>
          {/* Main Landing Route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected Dashboard Route */}
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          
          {/* Add future routes like /dashboard or /upload here */}
        </Routes>
      </Router>
      
    </ThemeProvider>
  );
}

export default App;