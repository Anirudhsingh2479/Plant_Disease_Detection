import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from './page/LandingPage';
import './App.css';

// 1. Create your base Material UI theme
let theme = createTheme({
  typography: {
    // You can customize your global font family here if needed
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
          <Route path="/" element={<LandingPage />} />
          {/* Add future routes like /dashboard or /upload here */}
        </Routes>
      </Router>
      
    </ThemeProvider>
  );
}

export default App;
