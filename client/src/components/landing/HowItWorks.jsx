import { Box, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material';

const HowItWorks = () => {
  const steps = [
    {
      label: '1. Upload',
      description: 'The user takes a photo of a plant leaf and uploads it to the React frontend.',
    },
    {
      label: '2. Process',
      description: 'The Node.js backend receives the image and standardizes it to a 256x256 pixel RGB format.',
    },
    {
      label: '3. Analyze',
      description: 'The custom ResNet50 deep learning model acts as a feature extractor, looking for biological markers of disease.',
    },
    {
      label: '4. Diagnose',
      description: 'The model returns the exact disease classification and a mathematical confidence score to the user.',
    },
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', backgroundColor: '#ffffff', p: 5, borderRadius: 4, boxShadow: 1 }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom sx={{ mb: 5 }}>
        How The Pipeline Works
      </Typography>
      <Stepper orientation="vertical">
        {steps.map((step) => (
          <Step key={step.label} active={true}>
            <StepLabel>
              <Typography variant="h6" fontWeight="bold">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography color="text.secondary">{step.description}</Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default HowItWorks;
