import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { toast } from 'react-toastify';
import PaginationControls from '../components/PaginationControls'; // Create this component

// Simple Loader Component
const Loader = () => <div className="text-center p-4">Loading users...</div>;
// Simple Error Component
const ErrorDisplay = ({ message }) => <div className="text-center p-4 text-red-600 bg-red-100 border border-red-400 rounded">{message}</div>;


function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10, // Items per page
  });

  // Use useCallback to memoize fetchUsers function
  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/users', {
        params: { page: page, limit: pagination.limit } // Send pagination params
      });
      setUsers(res.data.users || []); // Expecting paginated structure
      setPagination(prev => ({
        ...prev,
        currentPage: res.data.currentPage,
        totalPages: res.data.totalPages,
        totalUsers: res.data.totalUsers
      }));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users.');
      // Toast might be shown by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit]); // Dependency: pagination.limit

  // Fetch users on initial mount and when currentPage changes
  useEffect(() => {
    fetchUsers(pagination.currentPage);
  }, [fetchUsers, pagination.currentPage]);


  const updateCredits = async (id, currentCredits, amountToAdd) => {
    const newCredits = Number(currentCredits) + Number(amountToAdd); // Calculate new total
    if (isNaN(newCredits)) {
      toast.error("Invalid credit amount.");
      return;
    }

    // Optimistic UI update (optional) - revert on error
    // setUsers(prevUsers => prevUsers.map(u => u._id === id ? { ...u, credits: newCredits } : u));

    try {
      // Send the *new total* credits value to the backend endpoint
      const res = await apiClient.put(`/admin/user/${id}/credits`, { credits: newCredits });

      // Update state with the confirmed data from backend response
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === id ? { ...user, credits: res.data.credits } : user // Use response data
        )
      );
      toast.success(`Credits updated for user ${res.data.name}.`);
    } catch (err) {
      console.error('Failed to update credits:', err);
      toast.error(err.response?.data?.message || 'Failed to update credits.');
      // Revert optimistic update if implemented
      // fetchUsers(pagination.currentPage); // Or refetch to be sure
    }
    // NO window.location.reload();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };


  // --- Rendering ---
  if (isLoading && users.length === 0) return <Loader />; // Show loader only on initial load
  if (error) return <ErrorDisplay message={error} />;


  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard - User Management</h1>

      {isLoading && <div className="text-center text-blue-500">Updating user list...</div>}

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-right">Credits</th>
              <th className="border px-4 py-2 text-center">Joined</th>
              <th className="border px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && !isLoading && (
              <tr><td colSpan="5" className="text-center py-4 text-gray-500">No users found.</td></tr>
            )}
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2 text-right font-medium">{user.credits}</td>
                <td className="border px-4 py-2 text-center text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="border px-4 py-2 text-center space-x-1">
                  {/* Simplified actions - add more features like edit/delete/view profile */}
                  <button
                    onClick={() => updateCredits(user._id, user.credits, 10)}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded transition duration-150"
                    title="Add 10 Credits"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => updateCredits(user._id, user.credits, -10)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition duration-150"
                    title="Subtract 10 Credits"
                    disabled={user.credits < 10} // Disable if not enough credits
                  >
                    -10
                  </button>
                  {/* Add direct credit set input if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

    </div>
  );
}

export default AdminDashboard;
