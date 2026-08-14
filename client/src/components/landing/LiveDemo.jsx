import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axiosInstance from '../../api/axiosInstance';

import Plant_image from '../../assets/Plant_image1.png';

const LiveDemo = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [authPrompt, setAuthPrompt] = useState(false);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : Plant_image),
    [selectedFile]
  );

  useEffect(() => {
    if (!selectedFile) {
      return undefined;
    }
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile, previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisMessage('');
      setErrorMessage('');
      setAuthPrompt(false);
    }
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisMessage('');
      setErrorMessage('');
      setAuthPrompt(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!user) {
      setAuthPrompt(true);
      setAnalysisMessage('');
      setErrorMessage('');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisMessage('');
    setErrorMessage('');
    setAuthPrompt(false);

    try {
      const formData = new FormData();
      formData.append('leafImage', selectedFile);

      const response = await axiosInstance.post('/predict/diagnose', formData, {
        headers: {
          'x-request-source': 'landing',
        },
      });

      const prediction = response.data?.prediction;
      const confidence = Number(prediction?.confidence ?? response.data?.data?.confidence ?? 0);
      const confidencePercent = Number.isFinite(confidence)
        ? (confidence * 100).toFixed(1)
        : '0.0';

      setAnalysisMessage(`${prediction?.diseaseName || 'Unknown'} (${confidencePercent}% confidence)`);
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      const detailMessage = error.response?.data?.details?.detail;
      const fallbackMessage = !error.response
        ? 'Request failed before reaching server. Check backend CORS/server status.'
        : error.message;
      setErrorMessage(detailMessage || backendMessage || fallbackMessage || 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const badgeText = useMemo(() => {
    if (analysisMessage && user) return analysisMessage;
    if (authPrompt) return 'Sign in required to view prediction';
    return 'Upload and analyze to see result';
  }, [analysisMessage, authPrompt, user]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' }, 
      gap: 3, 
      width: '100%',
      height: { xs: 'auto', sm: '380px', md: '410px' },
      alignItems: 'stretch'
    }}>
      
      {/* --- LEFT SIDE: LEAF IMAGE PREVIEW CARD --- */}
      <Paper 
        elevation={8} 
        sx={{ 
          position: 'relative', 
          borderRadius: 4, 
          overflow: 'hidden',
          flex: { xs: '1 1 100%', sm: '1 1 50%' },
          height: { xs: '320px', sm: '100%' },
          minWidth: 0,
          backgroundColor: '#1a1a1a',
        }}
      >
        <Box
          component="img"
          src={previewUrl}
          alt="Plant Disease Diagnosis"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />

        {/* Diagnosis Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            backgroundColor: authPrompt ? '#fee2e2' : '#ffdac7',
            color: authPrompt ? '#991b1b' : '#5c2b18',
            padding: '6px 14px',
            borderRadius: '24px',
            fontWeight: 700,
            fontSize: '0.8rem',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.25)',
            maxWidth: 'calc(100% - 28px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            zIndex: 2,
          }}
        >
          {badgeText}
        </Box>
      </Paper>

      {/* --- RIGHT SIDE: DRAG & DROP ZONE CARD --- */}
      <input
        accept="image/*"
        id="landing-file-input"
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Paper 
        elevation={0} 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        sx={{ 
          border: '2px dashed',
          borderColor: dragActive ? '#2e7d32' : '#a7f3d0',
          backgroundColor: 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(10px)',
          borderRadius: 4, 
          p: { xs: 2, sm: 3 }, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: { xs: '1 1 100%', sm: '1 1 50%' },
          height: { xs: '320px', sm: '100%' },
          minWidth: 0,
          textAlign: 'center', 
          transition: 'border-color 0.2s ease, background-color 0.2s ease', 
          cursor: 'pointer',
          '&:hover': { borderColor: '#2e7d32', backgroundColor: 'rgba(255, 255, 255, 0.9)' }
        }}
      >
        {/* Top Header Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
          <CloudUploadIcon sx={{ fontSize: { xs: 36, sm: 42 }, color: '#2e7d32', mb: 0.5 }} />
          <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
            Drag & Drop your leaf photo
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '280px' }}>
            {selectedFile ? selectedFile.name : 'High-res JPG or PNG (Max 5MB)'}
          </Typography>
        </Box>

        {/* Dedicated Alert / Message Container Slot */}
        <Box sx={{ minHeight: '64px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
          {authPrompt && (
            <Alert 
              severity="warning" 
              icon={<LockOutlinedIcon fontSize="small" />}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/login')} sx={{ fontWeight: 'bold', minWidth: 'auto' }}>
                  Sign In
                </Button>
              }
              sx={{ width: '100%', textAlign: 'left', borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}
            >
              Please sign in to view disease diagnosis or use our AI chatbot!
            </Alert>
          )}

          {analysisMessage && user && (
            <Alert severity="success" sx={{ width: '100%', textAlign: 'left', borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>
              Detected: {analysisMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error" sx={{ width: '100%', textAlign: 'left', borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>
              {errorMessage}
            </Alert>
          )}
        </Box>

        {/* Bottom Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', pb: 1 }}>
          <label htmlFor="landing-file-input">
            <Button
              component="span"
              variant="outlined"
              color="success"
              sx={{ borderRadius: 5, textTransform: 'none', px: 2.5, py: 0.75, fontSize: '0.875rem' }}
            >
              {selectedFile ? 'Change File' : 'Browse Files'}
            </Button>
          </label>

          {authPrompt ? (
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              startIcon={<LockOutlinedIcon />}
              sx={{ 
                borderRadius: 5, 
                textTransform: 'none', 
                px: 2.5,
                py: 0.75,
                fontSize: '0.875rem',
                backgroundColor: '#2e7d32', 
                '&:hover': { backgroundColor: '#1b5e20' } 
              }}
            >
              Sign In to View Diagnosis
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              sx={{ borderRadius: 5, textTransform: 'none', px: 2.5, py: 0.75, fontSize: '0.875rem' }}
            >
              {isAnalyzing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  Analyzing...
                </Box>
              ) : (
                'Analyze Leaf'
              )}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default LiveDemo;