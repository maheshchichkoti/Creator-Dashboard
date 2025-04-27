// middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
  console.error("ERROR STACK:", err.stack); // Log the full error stack for debugging

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if status code wasn't already set
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId Error (CastError)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404; // Or 400 depending on context, 404 often means "resource not found with that ID"
    message = `Resource not found`;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    // Extract meaningful messages from the validation error
    const messages = Object.values(err.errors).map((val) => val.message);
    message = `Invalid input data: ${messages.join(". ")}`;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for ${field}. Please use another value.`;
  }

  // JWT Errors (can customize based on specific JWT errors if needed)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please log in again.";
  }

  // Send response
  res.status(statusCode).json({
    message: message,
    // Optionally include stack trace in development mode only
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler };
