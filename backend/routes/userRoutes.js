// routes/userRoutes.js
const express = require("express");
const {
  getUserDashboard,
  saveFeed,
  shareFeed,
  spendCredits,
  getUserNotifications, // Import the new controller
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { body } = require("express-validator"); // Import validation

const router = express.Router();

// Apply protect middleware to all user routes
router.use(protect);

router.get("/dashboard", getUserDashboard);

router.post(
  "/save-feed",
  [
    // Validate the feed object being saved
    body("feed", "Feed data is required").isObject(),
    body("feed.title", "Feed title is required").notEmpty(),
    body("feed.url", "Feed URL is required").isURL(),
    body("feed.source", "Feed source is required").optional().notEmpty(), // Make source optional or required as needed
  ],
  saveFeed
);

router.post(
  "/share-feed",
  [
    // Validate title is provided for activity log
    body("title", "Shared feed title is required").notEmpty(),
    // You might also want the URL here depending on how sharing is tracked
    body("url", "Shared feed URL is required").optional().isURL(),
  ],
  shareFeed
);

router.post(
  "/spend-credits",
  [
    // Validate amount and purpose
    body("amount", "Amount must be a positive number")
      .isNumeric()
      .isInt({ gt: 0 }), // Ensure it's a positive integer
    body("purpose", "Purpose for spending credits is required").notEmpty(),
  ],
  spendCredits
);

// New route for getting notifications
router.get("/notifications", getUserNotifications);

module.exports = router;
