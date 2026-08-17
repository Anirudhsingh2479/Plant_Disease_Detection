import { useState } from 'react';
import PropTypes from 'prop-types';
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

const HistoryCard = ({ diagnosis, onGetRemedy }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleRemedyClick = () => {
    handleClose();
    if (onGetRemedy) {
      onGetRemedy(diagnosis);
    }
  };

  const date = diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString() : '';
  const isHealthy = String(diagnosis?.diseaseName || '').toLowerCase().includes('healthy');
  const confidenceVal = Number(diagnosis?.confidence || 0);
  const confidence = confidenceVal > 1 ? confidenceVal : confidenceVal * 100;
  let imageSrc = 'https://via.placeholder.com/600x400?text=No+Image';

  const persistedImageUrl = diagnosis?.cloudinaryUrl || diagnosis?.imageUrl;

  if (persistedImageUrl) {
    imageSrc = persistedImageUrl.startsWith('http')
      ? persistedImageUrl
      : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${persistedImageUrl.startsWith('/') ? '' : '/'}${persistedImageUrl}`;
  }

  return (
    <>
      <Card 
        sx={{ 
          width: '100%',
          height: '380px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          overflow: 'hidden',
          outline: 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(46, 125, 50, 0.12)',
            transform: 'translateY(-4px)',
            borderColor: '#2e7d32'
          }
        }}
      >
        <CardActionArea
          onClick={handleOpen}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            outline: 'none',
            '&:focus': { outline: 'none' },
            '& .MuiCardActionArea-focusHighlight': { opacity: 0 }
          }}
        >
          {/* Consistent Fixed-Height Image Container */}
          <Box sx={{ position: 'relative', height: 200, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
            <CardMedia
              component="img"
              height="200"
              image={imageSrc}
              alt={diagnosis?.diseaseName || 'Plant Leaf'}
              sx={{ objectFit: 'cover', width: '100%', height: '200px', display: 'block' }}
            />
            {/* Status Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: isHealthy ? 'rgba(46, 125, 50, 0.92)' : 'rgba(211, 47, 47, 0.92)',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                borderRadius: 50,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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

          {/* Consistent Fixed Content Block */}
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.5 }}>
            <Box sx={{ height: 52, display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: isHealthy ? '#2e7d32' : '#d32f2f',
                  lineHeight: 1.3,
                  fontSize: '1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {diagnosis?.diseaseName || 'Plant Diagnosis'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1 }}>
              <Chip
                label={`${confidence.toFixed(1)}% Confidence`}
                size="small"
                sx={{
                  background: 'rgba(46, 125, 50, 0.1)',
                  color: '#2e7d32',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(46, 125, 50, 0.2)'
                }}
              />

              {date && (
                <Typography variant="caption" color="text.secondary">
                  {date}
                </Typography>
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: '#fff', fontWeight: 'bold' }}>
          Diagnosis Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }} dividers>
          <Box
            component="img"
            src={imageSrc}
            alt="Full size leaf"
            sx={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 3, mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
            {diagnosis?.diseaseName}
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

          {diagnosis?.createdAt && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Analysis Date:</strong> {new Date(diagnosis.createdAt).toLocaleString()}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(46, 125, 50, 0.05)', borderRadius: 2 }}>
            💡 Tip: For best results, ensure good lighting and capture the affected area clearly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: '#2e7d32', fontWeight: 600 }}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRemedyClick}
            endIcon={<OpenInNewIcon />}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 3,
              px: 2.5
            }}
          >
            Get Remedy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

HistoryCard.propTypes = {
  diagnosis: PropTypes.object.isRequired,
  onGetRemedy: PropTypes.func,
};

export default HistoryCard;