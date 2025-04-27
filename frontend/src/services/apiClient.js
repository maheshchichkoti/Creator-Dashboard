// src/services/apiClient.js
import axios from "axios";
import { toast } from "react-toastify";

// Function to handle logout (avoids direct window manipulation deep in interceptor)
const logoutUser = () => {
  localStorage.removeItem("token");
  toast.error("Session expired. Please log in again.");
  // Redirect after a short delay to allow toast to be seen
  setTimeout(() => {
    // Use window.location for simplicity here, or emit an event for AuthContext
    window.location.href = "/login";
  }, 1500);
};

const apiClient = axios.create({
  // Use Vite's environment variable syntax
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // IMPORTANT for sending HttpOnly cookies like the refresh token
  withCredentials: true,
});

// Request Interceptor: Adds the auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get access token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor with Refresh Logic ---

let isRefreshing = false; // Flag to prevent multiple refresh attempts concurrently
let failedQueue = []; // Queue to hold requests that failed while refreshing

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error); // Reject promises if refresh failed
    } else {
      prom.resolve(token); // Resolve promises with new token if refresh succeeded
    }
  });
  failedQueue = []; // Clear the queue
};

apiClient.interceptors.response.use(
  (response) => response, // Simply return successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 Unauthorized and ensure it's not a refresh token failure itself
    if (
      error.response?.status === 401 &&
      originalRequest.url !== "/auth/refresh-token"
    ) {
      // If already refreshing, queue the original request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Retry the original request with the new token from the successful refresh
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest); // Re-run the original request
          })
          .catch((err) => {
            return Promise.reject(err); // Propagate error if refresh failed
          });
      }

      // Start the refresh process
      originalRequest._retry = true; // Mark request as retried (optional)
      isRefreshing = true;

      try {
        console.log("Attempting token refresh...");
        // Make the refresh request - cookies (refreshToken) are sent automatically
        const refreshResponse = await apiClient.get("/auth/refresh-token");
        const { accessToken } = refreshResponse.data;

        if (!accessToken) {
          throw new Error("No access token received from refresh");
        }

        console.log("Token refresh successful.");
        localStorage.setItem("token", accessToken); // Store the new access token

        // Apply the new token to the apiClient default headers for subsequent requests
        apiClient.defaults.headers.common["Authorization"] =
          "Bearer " + accessToken;
        // Also apply to the original request's headers for the immediate retry
        originalRequest.headers["Authorization"] = "Bearer " + accessToken;

        processQueue(null, accessToken); // Process queued requests with the new token

        return apiClient(originalRequest); // Retry the original request
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError, null); // Reject queued requests
        logoutUser(); // Logout if refresh fails
        return Promise.reject(refreshError); // Reject the original error
      } finally {
        isRefreshing = false; // Reset refreshing state
      }
    } else if (error.response) {
      // Handle other common errors globally (optional additions)
      console.error("API Error Response:", error.response);
      if (error.response.status === 403) {
        toast.error("Access Denied: You don't have permission.");
      } else if (error.response.status === 500) {
        toast.error("Server Error: Something went wrong on our end.");
      }
      // Allow component-level error handling to catch others
    } else if (error.request) {
      console.error("API No Response:", error.request);
      toast.error("Network Error: Could not reach the server.");
    } else {
      console.error("API Request Setup Error:", error.message);
      toast.error("Error: Could not send request.");
    }

    // IMPORTANT: Always reject the promise so component catches still work for non-401 errors
    // or if refresh logic fails.
    return Promise.reject(error);
  }
);

export default apiClient;
