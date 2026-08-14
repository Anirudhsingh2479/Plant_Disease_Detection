import { Grid, Card, CardContent, Typography, Box } from '@mui/material';

const ReportCard = () => {
  const metrics = [
    { title: "Training Accuracy", score: "98.94%", color: "#3b82f6", desc: "Model's capability on known data." },
    { title: "Validation Accuracy", score: "97.92%", color: "#8b5cf6", desc: "Precision during the tuning phase." },
    { title: "Testing Accuracy", score: "98.65%", color: "#2e7d32", desc: "True performance in the wild test." },
  ];

  return (
    // 1. Changed to overflowX: 'hidden' (only hides horizontal overspill)
    // 2. Added pb: 4 (padding-bottom) so the last card has room to breathe!
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowX: 'hidden', pb: 4 }}>
      
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 }, px: 2, width: '100%' }}>
        <Typography variant="h3" fontWeight="900" gutterBottom>
          Proven Performance
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Backed by a rigorous custom ResNet50 architecture. Our metrics prove high reliability for real-world agricultural scenarios.
        </Typography>
      </Box>

      <Grid 
        container 
        spacing={{ xs: 3, md: 4 }} 
        sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', width: '100%', px: { xs: 2, md: 0 }, maxWidth: '1100px', mx: 'auto' }} 
      >
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
            <Card 
              elevation={0} 
              sx={{ 
                width: '100%',
                maxWidth: '340px', 
                height: '100%', // 4. Tells the card to stretch to the full height of the grid column
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Centers the text perfectly inside the stretched card
                mx: 'auto',        
                borderRadius: 4, 
                textAlign: 'center', 
                py: 3,
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                  borderColor: metric.color
                }
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
                  {metric.title}
                </Typography>
                <Typography variant="h2" fontWeight="900" sx={{ color: metric.color, my: 2 }}>
                  {metric.score}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
    </Box>
  );
};

export default ReportCard;