import React from 'react';
import { Box } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import { keyframes } from '@mui/system';

// Animation for falling down
const fall = keyframes`
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
`;

// Animation for swaying side to side
const sway = keyframes`
  0%, 100% { margin-left: 0px; }
  50% { margin-left: 50px; }
`;

const AnimatedBackground = () => {
  // Create an array to generate multiple leaves
  const leaves = Array.from({ length: 15 }); 

  return (
    <Box sx={{ 
      position: 'fixed', // <--- CHANGED from 'absolute' to 'fixed'
      top: 0, 
      left: 0, 
      width: '100vw',    // <--- Changed to viewport width
      height: '100vh',   // <--- Changed to viewport height
      overflow: 'hidden', 
      zIndex: 0, 
      pointerEvents: 'none' 
    }}>
      {leaves.map((_, index) => {
        // Randomize the appearance and animation of each leaf
        const isLightGreen = index % 2 === 0;
        const leftPosition = `${Math.random() * 100}%`;
        const animationDuration = `${Math.random() * 10 + 10}s`; // Between 10s and 20s
        const animationDelay = `${Math.random() * 10}s`;
        const size = Math.random() * 30 + 20; // Between 20px and 50px

        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              left: leftPosition,
              top: '-10%',
              color: isLightGreen ? 'rgba(74, 222, 128, 0.4)' : 'rgba(46, 125, 50, 0.3)',
              animation: `${fall} ${animationDuration} linear infinite, ${sway} 4s ease-in-out infinite alternate`,
              animationDelay: `${animationDelay}, ${animationDelay}`,
            }}
          >
            <SpaIcon sx={{ fontSize: size }} />
          </Box>
        );
      })}
    </Box>
  );
};

export default AnimatedBackground;