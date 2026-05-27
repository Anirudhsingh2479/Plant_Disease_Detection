import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Paper } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import HistoryCard from './HistoryCard';
// import axios from 'axios'; 

const HistorySection = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // TODO: Replace with your actual Axios call when backend is running.
        // Make sure to pass your JWT token in the headers!
        // const response = await axios.get('/api/diagnosis/history', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        // });
        // setHistory(response.data);

        // Simulating backend data fetch for testing purposes
        setTimeout(() => {
          setHistory([
            {
              _id: '1',
              imageUrl: 'https://via.placeholder.com/300x200/e0f7fa/006064?text=Tomato+Leaf',
              diseaseName: 'Tomato Early Blight',
              confidence: 0.98,
              createdAt: new Date().toISOString(),
            },
            {
              _id: '2',
              imageUrl: 'https://via.placeholder.com/300x200/e8f5e9/1b5e20?text=Apple+Leaf',
              diseaseName: 'Healthy',
              confidence: 0.99,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              _id: '3',
              imageUrl: 'https://via.placeholder.com/300x200/ffe0b2/e65100?text=Corn+Leaf',
              diseaseName: 'Corn Leaf Rust',
              confidence: 0.95,
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError('Failed to load diagnosis history.');
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#2e7d32', mb: 2 }} />
          <Typography color="text.secondary">Loading diagnosis history...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 5, mb: 5, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, width: '100%', justifyContent: 'center' }}>
        <HistoryIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
          Your Diagnosis History
        </Typography>
      </Box>

      {/* Stats Summary */}
      {history.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {history.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Diagnoses
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {history.filter(d => d.diseaseName.toLowerCase() === 'healthy').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Healthy Plants
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)',
                border: '1px solid rgba(211, 47, 47, 0.2)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                {history.filter(d => d.diseaseName.toLowerCase() !== 'healthy').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Infected Plants
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {(history.reduce((acc, d) => acc + d.confidence, 0) / history.length * 100).toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Confidence
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* History Cards or Empty State */}
      {history.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 244, 0.9) 100%)',
            border: '1px solid rgba(46, 125, 50, 0.1)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            width: '100%',
            maxWidth: '600px'
          }}
        >
          <HistoryIcon sx={{ fontSize: 64, color: 'rgba(46, 125, 50, 0.2)', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#666' }}>
            No Diagnoses Yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload a plant image above to get started with AI-powered disease detection!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {history.map((diagnosis) => (
            <Grid item xs={12} sm={6} md={4} key={diagnosis._id} sx={{ display: 'flex', justifyContent: 'center' }}>
              {/* Passing the individual diagnosis data into the card we built earlier */}
              <HistoryCard diagnosis={diagnosis} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default HistorySection;