import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

// Simple Loader Component
const Loader = () => <div className="text-center p-4">Loading analytics...</div>;
// Simple Error Component
const ErrorDisplay = ({ message }) => <div className="text-center p-4 text-red-600 bg-red-100 border border-red-400 rounded">{message}</div>;


function AdminAnalytics() {
  const [topUsers, setTopUsers] = useState([]);
  const [topFeeds, setTopFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use Promise.all to fetch both concurrently
        const [usersRes, feedsRes] = await Promise.all([
          apiClient.get('/admin/top-users'),
          apiClient.get('/admin/top-saved-feeds')
        ]);
        setTopUsers(usersRes.data || []);
        setTopFeeds(feedsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.message || 'Failed to load analytics data.');
        // Toast might be shown by interceptor
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []); // Fetch only on mount

  if (isLoading) return <Loader />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-semibold mb-6">Admin Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Users Card */}
        <div className="bg-gray-50 p-4 rounded shadow-sm border">
          <h2 className="text-2xl font-semibold mb-3 border-b pb-2">Top 5 Users (by Credits)</h2>
          {topUsers.length > 0 ? (
            <ul className="space-y-2">
              {topUsers.map((user) => ( // Use user._id if available, otherwise email is likely unique
                <li key={user.email} className="border-b pb-1">
                  <span className="font-medium">{user.name || 'N/A'}</span> ({user.email}) -
                  <span className="font-bold text-green-600"> {user.credits} credits</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No user data available.</p>
          )}
        </div>

        {/* Top Saved Feeds Card */}
        <div className="bg-gray-50 p-4 rounded shadow-sm border">
          <h2 className="text-2xl font-semibold mb-3 border-b pb-2">Top 5 Saved Feeds</h2>
          {topFeeds.length > 0 ? (
            <ul className="space-y-2">
              {topFeeds.map((feed) => ( // Use feed.title as key, assuming unique in top 5
                <li key={feed.title} className="border-b pb-1">
                  <span className="font-medium">{feed.title}</span> -
                  <span className="font-bold text-blue-600"> {feed.count} saves</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No feed save data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;