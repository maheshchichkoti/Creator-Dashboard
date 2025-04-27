// routes/reportRoutes.js
const express = require("express");
const { reportFeed, getReports } = require("../controllers/reportController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { body, query } = require("express-validator"); // Import validation

const router = express.Router();

// User can report a feed
router.post(
  "/report",
  protect, // Only logged-in users can report
  [
    // Basic validation for the post object and reason
    body("post", "Post data is required").isObject(),
    body("post.title", "Post title is required in report")
      .optional()
      .notEmpty(), // Optional but good to have
    body("post.url", "Post URL is required in report").isURL(),
    body("reason", "Reason can be provided").optional().isString().trim(),
  ],
  reportFeed
);

// Admin can view reports with pagination
router.get(
  "/reports",
  protect,
  adminOnly, // Only admins can view reports
  [
    // Add validation for pagination
    query("page").optional().isInt({ gt: 0 }).toInt(),
    query("limit").optional().isInt({ gt: 0 }).toInt(),
  ],
  getReports
);

module.exports = router;
