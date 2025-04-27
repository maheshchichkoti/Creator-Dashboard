import React, { createContext, useReducer, useEffect, useContext } from "react";
import apiClient from "../services/apiClient"; // Use our apiClient
import { toast } from "react-toastify";

// Initial State
const initialState = {
  token: localStorage.getItem("token"),
  isAuthenticated: null, // null initially, true/false after check
  isLoading: true, // Start loading until user check is complete
  user: null, // Holds user details (id, name, email, role, credits etc.)
  isAdmin: false,
};

// Action Types
const ActionTypes = {
  USER_LOADING: "USER_LOADING",
  USER_LOADED: "USER_LOADED",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  AUTH_ERROR: "AUTH_ERROR",
  LOGOUT_SUCCESS: "LOGOUT_SUCCESS",
  UPDATE_USER_CREDITS: "UPDATE_USER_CREDITS",
};

// Reducer Function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.USER_LOADING:
      return {
        ...state,
        isLoading: true,
      };
    case ActionTypes.USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload,
        isAdmin: action.payload?.role === "admin",
      };
    case ActionTypes.LOGIN_SUCCESS:
    case ActionTypes.REGISTER_SUCCESS:
      localStorage.setItem("token", action.payload.accessToken); // Use accessToken from payload
      return {
        ...state,
        ...action.payload, // Contains accessToken and user object
        token: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: action.payload.user?.role === "admin",
      };
    case ActionTypes.UPDATE_USER_CREDITS:
      return {
        ...state,
        user: state.user ? { ...state.user, credits: action.payload } : null,
      };
    case ActionTypes.AUTH_ERROR:
    case ActionTypes.LOGOUT_SUCCESS:
      localStorage.removeItem("token");
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false,
      };
    default:
      return state;
  }
};

// Create Context
export const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Attempt to load user on initial mount if token exists
  useEffect(() => {
    loadUser();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Action: Load User (Check if token is valid and get user data)
  const loadUser = async () => {
    const token = localStorage.getItem("token"); // Check storage directly on load
    if (!token) {
      dispatch({ type: ActionTypes.AUTH_ERROR });
      return;
    }
    // If token exists, dispatch loading and try to fetch user data
    dispatch({ type: ActionTypes.USER_LOADING });
    try {
      // Use the dashboard route which should be protected and return user data
      const res = await apiClient.get("/user/dashboard");
      dispatch({
        type: ActionTypes.USER_LOADED,
        payload: res.data, // Backend returns user data
      });
    } catch (err) {
      // If token is invalid (401 handled by interceptor, but catch others)
      dispatch({ type: ActionTypes.AUTH_ERROR });
    }
  };

  // Action: Register User
  const register = async (formData) => {
    try {
      const res = await apiClient.post("/auth/register", formData);
      dispatch({
        type: ActionTypes.REGISTER_SUCCESS,
        payload: res.data, // Expect { accessToken, user: {...} }
      });
      toast.success("Registration successful!");
      return true; // Indicate success
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed";
      // Handle specific validation errors if backend sends them structured
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e.msg));
      } else {
        toast.error(errorMsg);
      }
      dispatch({ type: ActionTypes.AUTH_ERROR });
      return false; // Indicate failure
    }
  };

  // Action: Login User
  const login = async (formData) => {
    try {
      const res = await apiClient.post("/auth/login", formData);
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: res.data, // Expect { accessToken, user: {...} }
      });
      toast.success(res.data.message || "Login successful!"); // Use message from backend if available
      return true; // Indicate success
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed";
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e.msg));
      } else {
        toast.error(errorMsg);
      }
      dispatch({ type: ActionTypes.AUTH_ERROR });
      return false; // Indicate failure
    }
  };

  // Action: Logout User
  const logout = () => {
    dispatch({ type: ActionTypes.LOGOUT_SUCCESS });
    toast.info("You have been logged out.");
    // No need to call backend logout unless you implement server-side token invalidation
  };

  // Action: Update Credits locally (e.g., after spending)
  const updateUserCredits = (newCreditAmount) => {
    dispatch({
      type: ActionTypes.UPDATE_USER_CREDITS,
      payload: newCreditAmount,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loadUser,
        register,
        login,
        logout,
        updateUserCredits, // Expose the function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
