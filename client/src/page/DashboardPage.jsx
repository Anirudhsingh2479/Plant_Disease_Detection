import { useState } from 'react';
import { Fab, Box, Container, Typography, Tooltip, Fade, Zoom } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { motion } from 'framer-motion';

// Layout components
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UploadSection from '../components/dashboard/UploadSection';
import HistorySection from '../components/dashboard/HistorySection';
import ChatSidePanel from '../components/dashboard/ChatSidePanel';

// --- NEW HELPER COMPONENTS FOR LEAF EFFECTS ---

// 1. Stylized CSS Leaf component
const LeafShape = ({ size, color }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      // Creates a leaf shape: smooth top-right and bottom-left, pointy others
      borderRadius: '50% 0', 
      position: 'relative',
      // Orient the leaf vertically
      transform: 'rotate(-45deg)', 
      pointerEvents: 'none', // Ensure it doesn't block interactions
    }}
  >
    {/* Optional: Simple stylized stem child component */}
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        width: '1px',
        height: '40%',
        backgroundColor: '#0f2e22', // Darker green for stem
        opacity: 0.3,
        transform: 'translateX(-50%)',
      }}
    />
  </div>
);

// 2. Framer Motion component to handle the floating animation
const FloatingLeaf = ({ size, startX, startY, delay, duration, color }) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        pointerEvents: 'none',
        zIndex: 0, // Behind main content containers
      }}
      initial={{ opacity: 0, y: 0, x: 0, rotate: 0 }}
      animate={{
        // Fades in, holds, fades out
        opacity: [0, 0.15, 0.15, 0], 
        // Moves up
        y: -300, 
        // Horizontal sway keyframes (creates a "wobble")
        x: ['0%', '-3%', '3%', '0%'], 
        // Slight rotation wobble
        rotate: [0, 30, -30, 0], 
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        repeatDelay: 1, // Short pause between repetitions
        delay: delay,
        ease: 'easeInOut',
      }}
    >
      <LeafShape size={size} color={color} />
    </motion.div>
  );
};

// ---------------------------------------------

const DashboardPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [detectedDisease, setDetectedDisease] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleScanComplete = (prediction) => {
    setDetectedDisease(prediction);
    setHistoryRefreshKey((prev) => prev + 1);
    setIsChatOpen(true);
  };

  // Staggered entry animation states for the main content
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 80, damping: 16 }
    }
  };

  // --- Programmatic Tripling of Leaves ---

  // 1. Define your base set of varied leaves (your original 7 config items)
  const originalLeaves = [
    { size: 45, startX: '12%', startY: '15%', delay: 0, duration: 16 },
    { size: 30, startX: '78%', startY: '25%', delay: 2, duration: 14 },
    { size: 55, startX: '25%', startY: '60%', delay: 4, duration: 18 },
    { size: 35, startX: '85%', startY: '75%', delay: 6, duration: 15 },
    { size: 50, startX: '55%', startY: '88%', delay: 8, duration: 17 },
    { size: 40, startX: '5%', startY: '95%', delay: 10, duration: 16 },
    { size: 30, startX: '95%', startY: '5%', delay: 1, duration: 13 },
  ];

  // 2. Generate a tripled list by mapping variations with distinct time offsets
  const leafConfig = [
    ...originalLeaves, // Original set (Starts immediately)
    ...originalLeaves.map(leaf => ({ ...leaf, delay: leaf.delay + 3.5 })), // Copy 1 (Starts after ~3.5s)
    ...originalLeaves.map(leaf => ({ ...leaf, delay: leaf.delay + 7.0 }))  // Copy 2 (Starts after ~7.0s)
  ];

  const leafColor = '#2e7d32'; // Existing green success color used for leaves

  return (
    <DashboardLayout>
      <Box 
        sx={{ 
          position: 'relative',
          minHeight: '100vh', 
          backgroundColor: '#f4f7f5', 
          pt: { xs: 6, md: 10 }, 
          pb: { xs: 10, md: 14 },
          overflow: 'hidden', // Contain the moving leaves within the viewport
          zIndex: 1, // Base for stacking context
        }}
      >
        
        {/* --- LIVE MOVING LEAVES BACKGROUND LAYER --- */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0, // top: 0, left: 0, width: 100%, height: 100%
            pointerEvents: 'none', // Important: don't block interactions
            overflow: 'hidden',
          }}
        >
          {leafConfig.map((leaf, index) => (
            <FloatingLeaf 
              key={index}
              {...leaf}
              color={leafColor}
            />
          ))}
        </Box>
        {/* --------------------------------------------- */}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
          >
            
            {/* Elegant Header Section */}
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 8, textAlign: 'center' }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#0f2e22', // Deep Rich Green-Black
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '2.2rem', md: '3.2rem' }
                  }}
                >
                  Plant Health Diagnostics
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    maxWidth: 580, 
                    mx: 'auto', 
                    fontSize: '1.15rem', 
                    color: '#4a5c54',
                    lineHeight: 1.6 
                  }}
                >
                  Upload a photo of your crop. Our neural networks will instantly cross-reference plant metrics to ensure your yield stays protected.
                </Typography>
              </Box>
            </motion.div>

            {/* Premium Glassmorphic Upload Card */}
            <motion.div variants={itemVariants}>
              <Box 
                sx={{ 
                  mb: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly translucent
                  backdropFilter: 'blur(16px)', // Frosted glass effect
                  borderRadius: '24px',
                  boxShadow: '0 20px 50px rgba(15, 46, 34, 0.04), 0 1px 0px rgba(255, 255, 255, 0.6) inset',
                  border: '1px solid rgba(220, 230, 225, 0.7)',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 30px 60px rgba(15, 46, 34, 0.08)',
                    borderColor: 'rgba(46, 125, 50, 0.3)',
                  }
                }}
              >
                <UploadSection onScanComplete={handleScanComplete} />
              </Box>
            </motion.div>

            {/* Diagnostics History Section */}
            <motion.div variants={itemVariants}>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4, 
                    fontWeight: 700, 
                    color: '#0f2e22',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  Recent Analytics
                </Typography>
                <HistorySection refreshKey={historyRefreshKey} />
              </Box>
            </motion.div>

          </motion.div>
        </Container>
      </Box>

      {/* Modern High-End Floating Action Button */}
      <Tooltip 
        title="Consult AI Agronomist" 
        placement="left" 
        TransitionComponent={Zoom}
        enterDelay={400}
      >
        <Fab 
          onClick={() => { 
            setDetectedDisease(""); 
            setIsChatOpen(true); 
          }}
          sx={{ 
            position: 'fixed', 
            bottom: 40, 
            right: 40,
            backgroundColor: '#0f2e22',
            color: '#ffffff',
            width: 60,
            height: 60,
            boxShadow: '0px 12px 28px rgba(15, 46, 34, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            '&:hover': {
              transform: 'scale(1.1) rotate(12deg)',
              backgroundColor: '#1b4332',
              boxShadow: '0px 16px 32px rgba(15, 46, 34, 0.4)',
            },
            zIndex: 1000, // Ensure it's always on top
          }}
        >
          <ChatIcon sx={{ fontSize: 26 }} />
        </Fab>
      </Tooltip>

      <ChatSidePanel 
        open={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        detectedDisease={detectedDisease} 
      />
    </DashboardLayout>
  );
};

export default DashboardPage;