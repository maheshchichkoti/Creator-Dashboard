import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading Authentication...</div>; // Or a spinner component
  }

  if (isAuthenticated && isAdmin) {
    // User is authenticated AND is an admin
    return children;
  }

  if (isAuthenticated && !isAdmin) {
    // User is logged in but NOT an admin
    toast.warn("Access denied. Admin privileges required.");
    // Redirect them to their dashboard or home page
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // User is not authenticated at all
  return <Navigate to="/login" state={{ from: location }} replace />;
}

export default AdminRoute;
