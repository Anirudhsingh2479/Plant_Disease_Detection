import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UploadSection from '../components/dashboard/UploadSection';
import HistorySection from '../components/dashboard/HistorySection';

const DashboardPage = () => {
  return (
    // DashboardLayout handles the Navbar at the top and Footer at the bottom
    <DashboardLayout>
      
      {/* Top half of the page: Drag & Drop / Image Upload functionality */}
      <UploadSection />
      
      {/* Bottom half of the page: Grid of previous diagnoses fetched from the backend */}
      <HistorySection />

    </DashboardLayout>
  );
};

export default DashboardPage;