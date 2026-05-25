import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

const UploadSection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle when the user selects a file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a temporary URL to show the image preview
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle sending the file to the backend
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);

    try {
      // TODO: Create a FormData object, append the file, and make your Axios POST request here.
      // Example:
      // const formData = new FormData();
      // formData.append('image', selectedFile);
      // await axios.post('/api/diagnosis/analyze', formData, { ...headers });

      // Simulating a delay for the ML model response
      setTimeout(() => {
        alert("Analysis Complete! (Connect API here)");
        setIsAnalyzing(false);
        // Clear the upload section after success
        setSelectedFile(null);
        setPreviewUrl(null);
      }, 2000);

    } catch (error) {
      console.error("Error analyzing image:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <Paper sx={{ p: 4, mb: 4, textAlign: 'center', backgroundColor: '#fafafa' }}>
      <Typography variant="h5" gutterBottom>
        Diagnose a New Plant
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload a clear photo of a plant leaf to detect diseases instantly.
      </Typography>

      {/* Hide the default HTML file input and use a MUI button to trigger it */}
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="raised-button-file">
        <Button variant="outlined" component="span" sx={{ mb: 3 }}>
          Select Leaf Image
        </Button>
      </label>

      {/* Image Preview Area */}
      {previewUrl && (
        <Box sx={{ my: 3 }}>
          <img 
            src={previewUrl} 
            alt="Leaf Preview" 
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} 
          />
        </Box>
      )}

      {/* Analyze Button (Only shows if an image is selected) */}
      {selectedFile && (
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing Image...' : 'Analyze Disease'}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default UploadSection;