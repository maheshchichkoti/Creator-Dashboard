// src/services/apiClient.js
import axios from "axios";
import { toast } from "react-toastify";

// Function to handle logout (avoids direct window manipulation deep in interceptor)
const logoutUser = () => {
  localStorage.removeItem("token");
  if (!toast.isActive("session-expired")) {
    toast.error("Session expired. Please log in again.", {
      toastId: "session-expired",
    });
  }
  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RE-VERIFIED Response Interceptor with Refresh Logic ---

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // --- Determine the request's path ---
    let requestPath = "[Could not parse URL]";
    try {
      // originalRequest.url is usually relative to baseURL for apiClient calls
      // For example, if baseURL is 'http://localhost:8000/api'
      // and you call apiClient.post('/auth/login', ...),
      // originalRequest.url will be '/auth/login'.
      // We need to construct the full path if baseURL is present to be safe.
      let fullPath;
      if (originalRequest.baseURL && originalRequest.url.startsWith("/")) {
        fullPath =
          originalRequest.baseURL.replace(/\/$/, "") + originalRequest.url;
      } else {
        fullPath = originalRequest.url;
      }
      requestPath = new URL(fullPath).pathname;
    } catch (urlParseError) {
      console.error(
        "Interceptor: Could not parse URL for path extraction:",
        originalRequest?.url,
        urlParseError
      );
      requestPath =
        typeof originalRequest?.url === "string"
          ? originalRequest.url
          : "[No URL]";
    }

    // Define paths that should NOT trigger a refresh on 401
    const noRefreshPaths = [
      "/api/auth/login",
      "/api/auth/refresh-token",
      // Add '/api/auth/register' if you don't want refresh attempts there either
    ];

    if (error.response?.status === 401) {
      console.log(`Interceptor: Caught 401. Request path: "${requestPath}"`); // DEBUG

      if (!noRefreshPaths.some((path) => requestPath.endsWith(path))) {
        // 401 on a path NOT in noRefreshPaths (e.g., /api/user/dashboard) -> Attempt Refresh
        console.log(
          "Interceptor: Path is NOT login/refresh. Entering REFRESH logic."
        );

        if (isRefreshing) {
          console.log("Interceptor: Already refreshing, queuing request.");
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = "Bearer " + token;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log(
            "Interceptor: Attempting token refresh call (/api/auth/refresh-token)..."
          );
          const refreshResponse = await apiClient.get("/auth/refresh-token");
          const { accessToken } = refreshResponse.data;

          if (!accessToken) throw new Error("No access token from refresh");

          console.log("Interceptor: Token refresh successful.");
          localStorage.setItem("token", accessToken);
          apiClient.defaults.headers.common["Authorization"] =
            "Bearer " + accessToken;
          originalRequest.headers["Authorization"] = "Bearer " + accessToken;

          processQueue(null, accessToken);
          console.log("Interceptor: Retrying original request to", requestPath);
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error(
            "Interceptor: Token refresh FAILED.",
            refreshError.response?.data || refreshError.message
          );
          processQueue(refreshError, null);
          logoutUser();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else if (requestPath.endsWith("/api/auth/login")) {
        console.log(
          "Interceptor: Path IS login. Propagating 401 (Invalid Credentials)."
        );
        // Let error propagate to AuthContext.login's catch block.
      } else if (requestPath.endsWith("/api/auth/refresh-token")) {
        console.log(
          "Interceptor: Path IS refresh-token and it failed. Logging out."
        );
        // If the refresh token itself fails with 401/403, logout
        processQueue(error, null); // Process queue with error if any requests were waiting
        logoutUser();
        // The Promise.reject at the end handles propagating this.
      }
    } else if (error.response) {
      // Handle other status codes (403, 500, etc.)
      console.error(
        "API Error (Non-401):",
        error.response.status,
        requestPath,
        error.response.data
      );
      if (
        error.response.status === 403 &&
        !requestPath.endsWith("/api/auth/refresh-token")
      ) {
        toast.error("Access Denied: You don't have permission.");
      } else if (error.response.status === 500) {
        toast.error("Server Error: Something went wrong.");
      }
    } else if (error.request) {
      // Network error (no response)
      console.error("API No Response:", requestPath, error.request);
      if (!navigator.onLine) toast.warn("You appear to be offline.");
      else toast.error("Network Error: Could not reach server.");
    } else {
      // Request setup error
      console.error("API Request Setup Error:", error.message);
      toast.error("Error: Could not send request.");
    }

    // ALWAYS reject the promise if it wasn't successfully handled by a retry
    return Promise.reject(error);
  }
);

export default apiClient;
