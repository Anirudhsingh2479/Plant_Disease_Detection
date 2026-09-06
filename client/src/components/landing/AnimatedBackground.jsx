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

const leaves = Array.from({ length: 15 }, (_, index) => ({
  id: index,
  isLightGreen: index % 2 === 0,
  leftPosition: `${((index * 37) % 100)}%`,
  animationDuration: `${10 + ((index * 7) % 10)}s`,
  animationDelay: `${(index * 3) % 10}s`,
  size: 20 + ((index * 11) % 30),
}));

const AnimatedBackground = () => {
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
      {leaves.map((leaf) => {
        return (
          <Box
            key={leaf.id}
            sx={{
              position: 'absolute',
              left: leaf.leftPosition,
              top: '-10%',
              color: leaf.isLightGreen ? 'rgba(74, 222, 128, 0.4)' : 'rgba(46, 125, 50, 0.3)',
              animation: `${fall} ${leaf.animationDuration} linear infinite, ${sway} 4s ease-in-out infinite alternate`,
              animationDelay: `${leaf.animationDelay}, ${leaf.animationDelay}`,
            }}
          >
            <SpaIcon sx={{ fontSize: leaf.size }} />
          </Box>
        );
      })}
    </Box>
  );
};

export default AnimatedBackground;
