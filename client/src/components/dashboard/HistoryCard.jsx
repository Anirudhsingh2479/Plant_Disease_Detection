import { useState } from 'react';
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
  DialogActions,
  Chip,
  Box
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const HistoryCard = ({ diagnosis }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const date = new Date(diagnosis.createdAt).toLocaleDateString();
  const isHealthy = diagnosis.diseaseName.toLowerCase() === 'healthy';
  const confidence = diagnosis.confidence * 100;
  let imageSrc = 'https://via.placeholder.com/600x400?text=No+Image';

  if (diagnosis.imageUrl) {
    imageSrc = diagnosis.imageUrl.startsWith('http')
      ? diagnosis.imageUrl
      : `http://localhost:5000${diagnosis.imageUrl.startsWith('/') ? '' : '/'}${diagnosis.imageUrl}`;
  }

  return (
    <>
      <Card 
        sx={{ 
          maxWidth: 345,
          margin: 2,
          boxShadow: '0 4px 12px rgba(46, 125, 50, 0.08)',
          border: '1px solid rgba(46, 125, 50, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(46, 125, 50, 0.15)',
            transform: 'translateY(-4px)',
            borderColor: 'rgba(46, 125, 50, 0.3)'
          }
        }}
      >
        <CardActionArea onClick={handleOpen} sx={{ height: '100%' }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="200"
              image={imageSrc}
              alt="Uploaded Leaf"
              sx={{ objectFit: 'cover' }}
            />
            {/* Status Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: isHealthy ? 'rgba(46, 125, 50, 0.9)' : 'rgba(211, 47, 47, 0.9)',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                borderRadius: 50,
                backdropFilter: 'blur(5px)'
              }}
            >
              {isHealthy ? (
                <CheckCircleIcon sx={{ fontSize: 16 }} />
              ) : (
                <WarningIcon sx={{ fontSize: 16 }} />
              )}
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {isHealthy ? 'Healthy' : 'Infected'}
              </Typography>
            </Box>
          </Box>

          <CardContent>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                color: isHealthy ? '#2e7d32' : '#d32f2f',
                mb: 1
              }}
            >
              {diagnosis.diseaseName}
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <Chip
                label={`${confidence.toFixed(1)}% Confidence`}
                size="small"
                sx={{
                  background: `linear-gradient(135deg, rgba(46, 125, 50, 0.2) 0%, rgba(46, 125, 50, 0.1) 100%)`,
                  color: '#2e7d32',
                  fontWeight: 600,
                  border: '1px solid rgba(46, 125, 50, 0.2)'
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {date}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: '#fff', fontWeight: 'bold' }}>
          Diagnosis Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }} dividers>
          <Box
            component="img"
            src={imageSrc}
            alt="Full size leaf"
            sx={{ width: '100%', borderRadius: 2, marginBottom: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />

          <Box sx={{ mb: 2 }}>
            <Chip
              icon={isHealthy ? <CheckCircleIcon /> : <WarningIcon />}
              label={isHealthy ? 'Plant is Healthy' : 'Disease Detected'}
              color={isHealthy ? 'success' : 'error'}
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
            {diagnosis.diseaseName}
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>AI Confidence Level:</strong>
          </Typography>
          <Box
            sx={{
              background: 'linear-gradient(to right, #2e7d32 0%, #2e7d32 ' + confidence + '%, #e0e0e0 ' + confidence + '%, #e0e0e0 100%)',
              borderRadius: 1,
              height: 8,
              mb: 1
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {confidence.toFixed(1)}% confident in this diagnosis
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Analysis Date:</strong> {new Date(diagnosis.createdAt).toLocaleString()}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(46, 125, 50, 0.05)', borderRadius: 1 }}>
            💡 Tip: For best results, ensure good lighting and capture the affected area clearly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ color: '#2e7d32', fontWeight: 600 }}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={handleClose}
            endIcon={<OpenInNewIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Get Remedy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HistoryCard;