// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes (only logged-in users)
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (excluding password)
      // Ensure user still exists
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        // If user associated with token no longer exists
        const error = new Error(
          "User belonging to this token no longer exists"
        );
        res.status(401); // Set status code for the error handler
        return next(error); // Use next(error)
      }

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401); // Set status code for the error handler
      // Pass specific JWT errors or a generic one to the error handler
      const authError = new Error(
        error.name === "TokenExpiredError"
          ? "Not authorized, token expired"
          : "Not authorized, token failed"
      );
      authError.name = error.name; // Preserve original error name if needed
      return next(authError); // Use next(error)
    }
  }

  if (!token) {
    res.status(401);
    const error = new Error("Not authorized, no token");
    return next(error); // Use next(error)
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  // Assumes protect middleware runs first and attaches req.user
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403); // Forbidden
    const error = new Error("Access denied, admin only");
    next(error); // Use next(error)
  }
};
