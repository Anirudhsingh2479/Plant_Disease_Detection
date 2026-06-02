import { useState } from 'react';
import { Fab } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";

// Your existing layout components
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UploadSection from '../components/dashboard/UploadSection';
import HistorySection from '../components/dashboard/HistorySection';

// The new Chat component
import ChatSidePanel from '../components/dashboard/ChatSidePanel';

const DashboardPage = () => {
  // 1. Add state for the Chat Panel
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [detectedDisease, setDetectedDisease] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // 2. Add handler for when the user successfully uploads/scans a plant
  const handleScanComplete = (prediction) => {
    setDetectedDisease(prediction);
    setHistoryRefreshKey((prev) => prev + 1);
    setIsChatOpen(true); // Auto-trigger the side panel!
  };

  return (
    // DashboardLayout handles the Navbar at the top and Footer at the bottom
    <DashboardLayout>
      
      {/* Top half: Drag & Drop / Image Upload functionality */}
      {/* Pass the handleScanComplete function down as a prop so UploadSection can trigger the chat */}
      <UploadSection onScanComplete={handleScanComplete} />
      
      {/* Bottom half: Grid of previous diagnoses fetched from the backend */}
      <HistorySection refreshKey={historyRefreshKey} />

      {/* Floating Action Button for Manual Chat */}
      <Fab 
        color="success" 
        onClick={() => { 
          setDetectedDisease(""); // Clear any previous specific disease context
          setIsChatOpen(true); 
        }}
        sx={{ position: 'fixed', bottom: 30, right: 30 }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Panel Controller */}
      <ChatSidePanel 
        open={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        detectedDisease={detectedDisease} 
      />

    </DashboardLayout>
  );
};

export default DashboardPage;