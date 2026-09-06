import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import HistoryCard from './HistoryCard';
import axiosInstance from '../../api/axiosInstance';

const HistorySection = ({ refreshKey = 0, onGetRemedy }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get('/diagnosis/history', {
          withCredentials: true
        });
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching history:", err);
        const backendMessage = err.response?.data?.message;
        setError(backendMessage || 'Failed to load diagnosis history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [refreshKey]);

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

  const healthyCount = history.filter(d => String(d.diseaseName || '').toLowerCase().includes('healthy')).length;
  const infectedCount = history.length - healthyCount;
  const avgConfidence = history.length > 0
    ? (history.reduce((acc, d) => acc + (d.confidence > 1 ? d.confidence : d.confidence * 100), 0) / history.length).toFixed(0)
    : 0;

  return (
    <Box sx={{ mt: 2, mb: 5, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, justifyContent: 'center' }}>
        <HistoryIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
          Your Diagnosis History
        </Typography>
      </Box>

      {/* Stats Summary Panel */}
      {history.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 4,
            width: '100%',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              borderRadius: 3,
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

          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              borderRadius: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              {healthyCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Healthy Plants
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)',
              border: '1px solid rgba(211, 47, 47, 0.2)',
              borderRadius: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              {infectedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Infected Plants
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              borderRadius: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              {avgConfidence}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Confidence
            </Typography>
          </Paper>
        </Box>
      )}

      {/* History Cards Grid */}
      {history.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            mx: 'auto',
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
            width: '100%',
          }}
        >
          {history.map((diagnosis) => (
            <HistoryCard key={diagnosis._id} diagnosis={diagnosis} onGetRemedy={onGetRemedy} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default HistorySection;

HistorySection.propTypes = {
  refreshKey: PropTypes.number,
  onGetRemedy: PropTypes.func,
};