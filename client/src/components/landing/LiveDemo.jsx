import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axiosInstance from '../../api/axiosInstance';

// Keep your image import here!
import Plant_image from '../../assets/Plant_image1.png';

const LiveDemo = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisMessage('');
    setErrorMessage('');

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

  return (
    // The main container is now a flex row
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, // Stacks on mobile, side-by-side on desktop
      gap: 3, 
      width: '100%',
      alignItems: 'stretch' // Makes both boxes the same height
    }}>
      
      {/* --- LEFT SIDE: THE LEAF IMAGE --- */}
      <Paper 
        elevation={8} 
        sx={{ 
          position: 'relative', 
          borderRadius: 4, 
          overflow: 'hidden',
          flex: 1, // Takes up equal space
          backgroundColor: '#1a1a1a',
          minHeight: '250px' // Ensures it doesn't collapse too small
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

        {/* The Diagnosis Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: '#ffdac7',
            color: '#5c2b18',
            padding: '6px 18px',
            borderRadius: '24px',
            fontWeight: 700,
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {analysisMessage || 'Upload and analyze to see result'}
        </Box>
      </Paper>

      {/* --- RIGHT SIDE: DRAG & DROP ZONE --- */}
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
          p: 4, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // Centers content vertically
          alignItems: 'center',     // Centers content horizontally
          flex: 1, // Takes up equal space
          textAlign: 'center', 
          transition: 'all 0.3s ease', 
          cursor: 'pointer',
          '&:hover': { borderColor: '#2e7d32', backgroundColor: 'rgba(255, 255, 255, 0.9)' }
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          Drag & Drop your leaf photo
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {selectedFile ? selectedFile.name : 'High-res JPG or PNG (Max 5MB)'}
        </Typography>

        {analysisMessage && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            Detected: {analysisMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {errorMessage}
          </Alert>
        )}

        <label htmlFor="landing-file-input">
          <Button
            component="span"
            variant="outlined"
            color="success"
            sx={{ mt: 2, borderRadius: 5, textTransform: 'none' }}
          >
            {selectedFile ? 'Change File' : 'Browse Files'}
          </Button>
        </label>

        <Button
          variant="contained"
          color="success"
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          sx={{ mt: 2, borderRadius: 5, textTransform: 'none' }}
        >
          {isAnalyzing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} color="inherit" />
              Analyzing...
            </Box>
          ) : (
            'Analyze Leaf'
          )}
        </Button>
      </Paper>

    </Box>
  );
};

export default LiveDemo;