import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
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
              imageUrl: 'https://via.placeholder.com/300x150/e0f7fa/006064?text=Tomato+Leaf',
              diseaseName: 'Tomato Early Blight',
              confidence: 0.98,
              createdAt: new Date().toISOString(),
            },
            {
              _id: '2',
              imageUrl: 'https://via.placeholder.com/300x150/e8f5e9/1b5e20?text=Apple+Leaf',
              diseaseName: 'Healthy',
              confidence: 0.99,
              createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
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

  // Show a loading spinner while fetching data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show an error message if the API fails
  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 5, mb: 5 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Your Previous Diagnoses
      </Typography>

      {/* Handle the case where the user has no history yet */}
      {history.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 4, bgcolor: '#f9f9f9', borderRadius: 2 }}>
          You haven't diagnosed any plants yet. Upload an image above to get started!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {history.map((diagnosis) => (
            <Grid item xs={12} sm={6} md={4} key={diagnosis._id}>
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