import React, { useEffect, useState, useMemo } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// Improved loader with animation - matching Feed page
const Loader = () => (
  <div className="flex justify-center items-center p-12">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-indigo-700 font-medium">Loading your dashboard...</p>
    </div>
  </div>
);

// Improved error display with retry option - matching Feed page
const ErrorDisplay = ({ message, onRetry }) => (
  <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-sm">
    <div className="text-red-600 text-5xl mb-4">⚠️</div>
    <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
    <p className="text-red-700 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

function UserDashboard() {
  const { user: contextUser, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const displayUser = useMemo(() => dashboardData || contextUser, [dashboardData, contextUser]);

  const reversedActivity = useMemo(() => {
    return displayUser?.activity ? [...displayUser.activity].reverse() : [];
  }, [displayUser?.activity]);

  const reversedNotifications = useMemo(() => {
    return displayUser?.notifications ? [...displayUser.notifications].reverse() : [];
  }, [displayUser?.notifications]);

  const fetchDashboard = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiClient.get('/user/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchDashboard();
    }
  }, [authLoading]);

  const handleMarkAllAsRead = async () => {
    toast.info('Mark all as read - connecting to backend soon!');

    if (dashboardData) {
      setDashboardData(prevData => ({
        ...prevData,
        notifications: prevData.notifications.map(n => ({ ...n, read: true }))
      }));
    } else if (contextUser) {
      console.warn("Attempting optimistic update on contextUser - consider context update function");
    }
  };

  const combinedLoading = authLoading || isLoading;

  if (combinedLoading) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchDashboard} />;
  if (!displayUser) return <ErrorDisplay message="Could not load user data." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome back, {displayUser.name}!</h1>
        <p className="text-gray-600">Manage your feeds, activities, and notifications.</p>
      </div>

      {/* Credit Card */}
      <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-white opacity-90">Available Credits</h2>
            {displayUser.lastLogin && (
              <span className="text-xs bg-white text-black bg-opacity-20 rounded-full px-3 py-1">
                Last login: {new Date(displayUser.lastLogin).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">{displayUser.credits ?? 'N/A'}</span>
            <span className="ml-2 text-white text-opacity-80">credits</span>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-white text-opacity-90">
              <div>User ID: {displayUser._id?.substring(0, 8) || 'N/A'}</div>
            </div>
            <button
              onClick={() => toast.info("Credit purchase feature coming soon!")}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors text-black text-sm rounded-lg px-4 py-2"
            >
              Get More Credits
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Saved Feeds Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden col-span-1">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
            <h2 className="text-xl font-semibold text-indigo-900 flex items-center">
              <span className="mr-2">💾</span>
              Saved Feeds
              <span className="ml-2 bg-indigo-200 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                {displayUser.savedFeeds?.length || 0}
              </span>
            </h2>
          </div>

          <div className="p-6">
            {displayUser.savedFeeds && displayUser.savedFeeds.length > 0 ? (
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {displayUser.savedFeeds.map((feed) => (
                  <li key={feed.url} className="py-3 group hover:bg-gray-50 transition-colors rounded-lg">
                    <a
                      href={feed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="text-indigo-600 group-hover:text-indigo-800 font-medium text-sm mb-1 break-words transition-colors">
                        {feed.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="flex items-center">
                          <span className="mr-1">📰</span>
                          {feed.source}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center">
                          <span className="mr-1">📅</span>
                          {new Date(feed.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📑</div>
                <p className="text-gray-500 mb-4">You haven't saved any feeds yet.</p>
                <a
                  href="/feed"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                >
                  Browse Feed
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden col-span-1">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <h2 className="text-xl font-semibold text-green-900 flex items-center">
              <span className="mr-2">📊</span>
              Recent Activity
            </h2>
          </div>

          <div className="p-6">
            {reversedActivity.length > 0 ? (
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {reversedActivity.map((act, idx) => (
                  <li key={`${idx}-${act.substring(0, 10)}`} className="py-3 flex items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <span className="text-sm">✓</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{act}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📈</div>
                <p className="text-gray-500">No recent activity recorded yet.</p>
                <p className="text-sm text-gray-400 mt-2">Your actions will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden col-span-1">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-blue-900 flex items-center">
              <span className="mr-2">🔔</span>
              Notifications
              {reversedNotifications.some(n => !n.read) && (
                <span className="ml-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                  New
                </span>
              )}
            </h2>

            {reversedNotifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>

          <div className="p-6">
            {reversedNotifications.length > 0 ? (
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {reversedNotifications.map((notif, idx) => (
                  <li
                    key={notif._id || `${idx}-${notif.timestamp}`}
                    className={`py-3 ${!notif.read ? 'bg-blue-50' : ''} rounded-lg transition-colors`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${!notif.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        <span className="text-sm">!</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="ml-2 bg-blue-200 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔕</div>
                <p className="text-gray-500">No notifications yet.</p>
                <p className="text-sm text-gray-400 mt-2">You'll be notified of important updates here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;