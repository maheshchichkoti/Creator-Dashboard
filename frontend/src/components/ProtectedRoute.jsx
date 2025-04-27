import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Use the context hook

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth(); // Get state from context
  const location = useLocation();

  // While checking auth status, show nothing or a loader
  if (isLoading) {
    return <div>Loading Authentication...</div>; // Or a spinner component
  }

  // If authenticated, render the child components
  if (isAuthenticated) {
    return children;
  }

  // If not authenticated, redirect to login, passing the intended destination
  return <Navigate to="/login" state={{ from: location }} replace />;
}

export default ProtectedRoute;