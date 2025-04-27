// app.js

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
// --- Route Imports ---
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const feedRoutes = require("./routes/feedRoutes"); // Ensure this is imported

// --- Middleware Imports ---
const { errorHandler } = require("./middleware/errorMiddleware"); // Import the error handler

// --- Load Environment Variables (Do this early) ---
dotenv.config();

// --- Connect to Database ---
connectDB();

// --- Initialize Express App ---  <<<<<----- Initialize app HERE
const app = express();

// --- Core Middleware ---

// Enable CORS (Configure properly for production)
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Get origin from env variable
    credentials: true, // Allow cookies/headers
  })
);

// Body Parsing Middleware (for JSON request bodies)
app.use(express.json());
// Optional: If you need to parse URL-encoded form data
app.use(express.urlencoded({ extended: false }));

// Cookie Parser Middleware (for reading cookies, like refreshToken)
app.use(cookieParser());

app.use(helmet());
// --- API Routes ---

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "API is healthy" });
});

// Mount Routers
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/feed", feedRoutes); // Mount the feed routes

// --- Global Error Handler Middleware ---  <<<<<----- MUST BE LAST!
// This catches errors passed by next(error) from routes/middleware above
app.use(errorHandler);

// --- Export the app ---
module.exports = app;
