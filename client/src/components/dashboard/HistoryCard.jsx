import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  CardActionArea, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  DialogActions 
} from '@mui/material';

const HistoryCard = ({ diagnosis }) => {
  // State to control if the "Full History" pop-up is open or closed
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Format the MongoDB timestamp to a readable date
  const date = new Date(diagnosis.createdAt).toLocaleDateString();

  return (
    <>
      {/* 1. THE SUMMARY CARD */}
      <Card sx={{ maxWidth: 345, margin: 2, boxShadow: 3 }}>
        {/* CardActionArea makes the whole card clickable and adds the hover ripple effect */}
        <CardActionArea onClick={handleOpen}>
          <CardMedia
            component="img"
            height="140"
            image={diagnosis.imageUrl}
            alt="Uploaded Leaf"
          />
          <CardContent>
            <Typography variant="h6" component="div">
              {diagnosis.diseaseName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Diagnosed on: {date}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      {/* 2. THE FULL HISTORY POP-UP (Modal) */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Diagnosis Details</DialogTitle>
        <DialogContent dividers>
          <img 
            src={diagnosis.imageUrl} 
            alt="Full size leaf" 
            style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} 
          />
          <Typography variant="h5" gutterBottom>
            Disease: {diagnosis.diseaseName}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>AI Confidence Level:</strong> {(diagnosis.confidence * 100).toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Upload Date:</strong> {new Date(diagnosis.createdAt).toLocaleString()}
          </Typography>
          
          {/* We can eventually map through remedies here! */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HistoryCard;