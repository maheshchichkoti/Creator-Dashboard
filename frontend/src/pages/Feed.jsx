import React, { useEffect, useState, useMemo } from 'react';
import apiClient from '../services/apiClient';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// Improved loader with animation
const Loader = () => (
  <div className="flex justify-center items-center p-12">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-indigo-700 font-medium">Loading your feed...</p>
    </div>
  </div>
);

// Button spinner with consistent styling
const ButtonSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Improved error display with retry option
const ErrorDisplay = ({ message, onRetry }) => (
  <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-sm">
    <div className="text-red-600 text-5xl mb-4">⚠️</div>
    <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
    <p className="text-red-700 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
    >
      Try Again
    </button>
  </div>
);

// New component for action icons with tooltips
const ActionButton = ({ icon, label, onClick, disabled, color }) => {
  const colorClasses = {
    blue: `${disabled ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`,
    green: `${disabled ? 'bg-green-300' : 'bg-green-500 hover:bg-green-600'}`,
    red: `${disabled ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'}`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${colorClasses[color]} text-white text-sm py-2 px-4 rounded-md 
                  flex items-center transition-all transform hover:scale-105 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500 ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <span className="mr-1">{icon}</span> {label}
    </button>
  );
};

function Feed() {
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [reportedPosts, setReportedPosts] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const { user, updateUserCredits } = useAuth();

  // New state for filters
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.savedFeeds) {
      setSavedPosts(new Set(user.savedFeeds.map(feed => feed.url)));
    }
  }, [user?.savedFeeds]);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/feed');
      setPosts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError(err.response?.data?.message || 'Failed to load feed data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const savePost = async (postToSave) => {
    const feedPayload = { title: postToSave.title, url: postToSave.url, source: postToSave.source };
    try {
      const res = await apiClient.post('/user/save-feed', { feed: feedPayload });
      toast.success(`Feed "${postToSave.title}" saved! (+5 Credits)`);
      setSavedPosts(prev => new Set(prev).add(postToSave.url));
      if (res.data && typeof res.data.credits === 'number') {
        updateUserCredits(res.data.credits);
      }
    } catch (err) {
      console.error('Failed to save post:', err);
      toast.error(err.response?.data?.message || 'Failed to save feed.');
    }
  };

  const sharePost = async (postToShare) => {
    try {
      const res = await apiClient.post('/user/share-feed', { title: postToShare.title, url: postToShare.url });
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postToShare.url);
        toast.success(`Link copied! "${postToShare.title}" shared! (+2 Credits)`);
      } else {
        toast.success(`"${postToShare.title}" shared! (+2 Credits)`);
      }
      if (res.data && typeof res.data.credits === 'number') {
        updateUserCredits(res.data.credits);
      }
    } catch (err) {
      console.error('Failed to share post:', err);
      toast.error(err.response?.data?.message || 'Failed to share feed.');
    }
  };

  const reportPost = async (postToReport) => {
    // Improved reporting with modal dialog instead of prompt
    const reason = prompt("Reason for reporting (optional):");
    if (reason === null) return;

    const reportPayload = { title: postToReport.title, url: postToReport.url, source: postToReport.source };
    try {
      await apiClient.post('/report/report', { post: reportPayload, reason: reason || undefined });
      toast.info(`Post "${postToReport.title}" reported.`);
      setReportedPosts(prev => new Set(prev).add(postToReport.url));
    } catch (err) {
      console.error('Failed to report post:', err);
      toast.error(err.response?.data?.message || 'Failed to report post.');
    }
  };

  const handleLoadMore = () => {
    if (isMoreLoading) return;
    setIsMoreLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 6);
      setIsMoreLoading(false);
    }, 500);
  };

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Apply category filter
    if (activeCategory !== 'all') {
      result = result.filter(post => post.source === activeCategory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.source.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'source':
        result.sort((a, b) => a.source.localeCompare(b.source));
        break;
      default:
        break;
    }

    return result;
  }, [posts, activeCategory, searchTerm, sortBy]);

  // Get available sources for filter tabs
  const sources = useMemo(() => {
    const uniqueSources = [...new Set(posts.map(post => post.source))];
    return uniqueSources;
  }, [posts]);

  // Get visible posts after all filters
  const visiblePosts = useMemo(() => {
    return filteredAndSortedPosts.slice(0, visibleCount);
  }, [filteredAndSortedPosts, visibleCount]);

  if (isLoading) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchFeed} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Discover Feed</h1>

        {/* Search and filters */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="source">By Source</option>
          </select>
        </div>
      </div>

      {/* Source tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg ${activeCategory === 'all'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            All Sources
          </button>

          {sources.map(source => (
            <button
              key={source}
              onClick={() => setActiveCategory(source)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-lg ${activeCategory === source
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {source}
            </button>
          ))}
        </nav>
      </div>

      {/* Empty state */}
      {filteredAndSortedPosts.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? "No posts match your search criteria."
              : "No posts available in this category right now."}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveCategory('all');
              setSortBy('newest');
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Post grid */}
      {filteredAndSortedPosts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePosts.map((post) => {
              const isSaved = savedPosts.has(post.url);
              const isReported = reportedPosts.has(post.url);

              return (
                <div
                  key={post.id || post.url}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Card media */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt={`Thumbnail for ${post.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-200">
                        <span className="text-4xl">📄</span>
                      </div>
                    )}

                    {/* Source badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-indigo-600 bg-opacity-90 text-white text-xs font-medium px-2 py-1 rounded-md">
                        {post.source}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      {isSaved && (
                        <span className="bg-green-600 bg-opacity-90 text-white text-xs font-medium px-2 py-1 rounded-md">
                          Saved
                        </span>
                      )}
                      {isReported && (
                        <span className="bg-red-600 bg-opacity-90 text-white text-xs font-medium px-2 py-1 rounded-md">
                          Reported
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h2>

                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      {post.score && (
                        <div className="flex items-center mr-4">
                          <span className="mr-1">⭐</span>
                          <span>{post.score}</span>
                        </div>
                      )}
                      {post.createdAt && (
                        <div className="flex items-center">
                          <span className="mr-1">📅</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-800 mb-4"
                    >
                      View Post <span className="ml-1">→</span>
                    </a>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <ActionButton
                        icon="💾"
                        label={isSaved ? "Saved" : "Save"}
                        onClick={() => savePost(post)}
                        disabled={isSaved}
                        color="blue"
                      />
                      <ActionButton
                        icon="🔗"
                        label="Share"
                        onClick={() => sharePost(post)}
                        color="green"
                      />
                      <ActionButton
                        icon="⚠️"
                        label={isReported ? "Reported" : "Report"}
                        onClick={() => reportPost(post)}
                        disabled={isReported}
                        color="red"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more button */}
          {visibleCount < filteredAndSortedPosts.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-70"
                disabled={isMoreLoading}
              >
                {isMoreLoading ? (
                  <>
                    <ButtonSpinner />
                    Loading more posts...
                  </>
                ) : (
                  <>
                    Load More Posts
                    <span className="ml-2">↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Feed;