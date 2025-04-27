import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import './App.css'

// Page Components
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import UserDashboard from './pages/UserDashboard';
import SpendCredits from './pages/SpendCredits';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound'; // Create a simple 404 page

// Layout & Route Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute'; // Import AdminRoute
import ErrorBoundary from './components/ErrorBoundary';
function App() {
  return (
    // Wrap the entire application with AuthProvider
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Routes within the main Layout */}
            <Route path="/" element={<Layout />}>
              {/* Public routes accessible without login (if any) */}
              {/* Example: <Route index element={<PublicHomePage />} /> */}

              {/* Protected User Routes */}
              <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                <Route index element={<UserDashboard />} />
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="feed" element={<Feed />} />
                <Route path="spend-credits" element={<SpendCredits />} />
              </Route>

              <Route path="admin" element={<AdminRoute><Outlet /></AdminRoute>}>
                <Route path="users" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="reports" element={<Reports />} />
                <Route index element={<AdminDashboard />} />
              </Route>

              {/* Standalone Login/Register routes (outside default Layout?) */}
              {/* Or keep them inside layout if you want header/footer */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;