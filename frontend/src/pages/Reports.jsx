import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/apiClient';
import PaginationControls from '../components/PaginationControls'; // Reuse pagination

// Simple Loader Component
const Loader = () => <div className="text-center p-4">Loading reports...</div>;
// Simple Error Component
const ErrorDisplay = ({ message }) => <div className="text-center p-4 text-red-600 bg-red-100 border border-red-400 rounded">{message}</div>;

function Reports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    limit: 10,
  });

  // Memoized fetch function
  const fetchReports = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/report/reports', {
        params: { page: page, limit: pagination.limit }
      });
      setReports(res.data.reports || []);
      setPagination(prev => ({
        ...prev,
        currentPage: res.data.currentPage,
        totalPages: res.data.totalPages,
        totalReports: res.data.totalReports,
      }));
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports.');
      // Toast might be shown by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit]); // Dependency on limit

  // Fetch on mount and page change
  useEffect(() => {
    fetchReports(pagination.currentPage);
  }, [fetchReports, pagination.currentPage]);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  // --- Rendering ---
  if (isLoading && reports.length === 0) return <Loader />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-semibold mb-6">Reported Posts</h1>

      {isLoading && <div className="text-center text-blue-500">Updating report list...</div>}

      {reports.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 py-4">No reports found.</p>
      )}

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report._id} className="border border-red-200 bg-red-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-red-800">{report.post?.title || 'No Title Provided'}</h2>
            <p className="text-sm text-gray-600 mb-1">
              URL: <a href={report.post?.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{report.post?.url}</a>
            </p>
            <p className="text-sm text-gray-700 mb-1">
              Reported by: <span className="font-medium">{report.reportedBy?.name || 'Unknown'}</span> ({report.reportedBy?.email || 'No email'})
            </p>
            <p className="text-red-700 mb-2">
              Reason: <span className="italic">{report.reason}</span>
            </p>
            <p className="text-xs text-gray-500">
              Reported on: {new Date(report.createdAt).toLocaleString()}
            </p>
            {/* Add Admin Actions Here (e.g., Dismiss Report, Ban User, Delete Post - requires backend implementation) */}
            <div className="mt-3 pt-2 border-t border-red-100 space-x-2">
              <button className="bg-gray-400 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded disabled:opacity-50" disabled>Dismiss (TBD)</button>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50" disabled>Warn User (TBD)</button>
            </div>
          </div>
        ))}
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

export default Reports;