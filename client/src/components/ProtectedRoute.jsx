import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  // 1. Grab the 'token' from your Redux store instead of 'user'
  // This ensures users stay logged in even after a page refresh
  const { token } = useSelector((state) => state.auth); 

  // 2. The Check: If there is no token, they are not authenticated. 
  // Redirect them to the login page.
  console.log("ProtectedRoute is checking the token. Value is:", token);
  if (!token) {
    // 'replace' prevents the user from clicking the back button to return to the protected route
    return <Navigate to="/login" replace />;
  }

  // 3. The Approval: If they have a token, open the gates and render the Dashboard
  return children;
};

export default ProtectedRoute;