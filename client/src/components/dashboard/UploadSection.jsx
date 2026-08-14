import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '../../api/axiosInstance';

const UploadSection = ({ onScanComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadSuccess(false);
      setErrorMessage('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setSelectedFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
      setUploadSuccess(false);
      setErrorMessage('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('leafImage', selectedFile);

      const response = await axiosInstance.post('/predict/diagnose', formData, {
        headers: {
          'x-request-source': 'dashboard',
        },
      });

      const diagnosis = response.data?.data;
      const diseaseName = diagnosis?.diseaseName || response.data?.prediction?.diseaseName || 'Unknown';

      setAnalysisMessage(`Detected: ${diseaseName}`);
      setUploadSuccess(true);

      if (typeof onScanComplete === 'function') {
        onScanComplete(diseaseName);
      }

      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error analyzing image:", error);
      const backendMessage = error.response?.data?.message;
      const detailMessage = error.response?.data?.details?.detail;
      setErrorMessage(detailMessage || backendMessage || 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 4, 
        mb: 4, 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 244, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(46, 125, 50, 0.1)',
        boxShadow: '0 8px 32px rgba(46, 125, 50, 0.08)',
        borderRadius: 3
      }}
    >
      <Box sx={{ mb: 3 }}>
        <CloudUploadIcon sx={{ fontSize: 48, color: '#2e7d32', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
          Diagnose a New Plant
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Upload a clear photo of a plant leaf to detect diseases instantly using AI.
        </Typography>
      </Box>

      {uploadSuccess && (
        <Alert 
          icon={<CheckCircleIcon />}
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {analysisMessage || 'Analysis complete! Image processed successfully.'}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="file-input"
        type="file"
        onChange={handleFileChange}
      />

      {/* Drag and Drop Area */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? '#2e7d32' : 'rgba(46, 125, 50, 0.2)',
          borderRadius: 2,
          p: 4,
          mb: 3,
          backgroundColor: dragActive ? 'rgba(46, 125, 50, 0.05)' : 'rgba(46, 125, 50, 0.02)',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
      >
        <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
          <ImageIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1 }}>
            Drag and drop your image here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to browse
          </Typography>
        </label>
      </Box>

      {/* Image Preview Area */}
      {previewUrl && (
        <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            component="img"
            src={previewUrl}
            alt="Leaf Preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
              mb: 2
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            File: {selectedFile?.name}
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="file-input">
          <Button
            variant="outlined"
            component="span"
            sx={{
              borderColor: '#2e7d32',
              color: '#2e7d32',
              '&:hover': {
                borderColor: '#1b5e20',
                backgroundColor: 'rgba(46, 125, 50, 0.05)'
              },
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {previewUrl ? 'Change Image' : 'Select Image'}
          </Button>
        </label>

        {previewUrl && (
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1b5e20 0%, #0d3b1a 100%)',
              },
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {isAnalyzing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Analyzing...
              </Box>
            ) : (
              'Analyze Plant'
            )}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default UploadSection;

UploadSection.propTypes = {
  onScanComplete: PropTypes.func,
};