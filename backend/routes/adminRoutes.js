// routes/adminRoutes.js
const express = require("express");
const {
  getAllUsers,
  updateUserCredits,
  getTopUsers,
  getTopSavedFeeds,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { param, body, query } = require("express-validator"); // Import validation functions

const router = express.Router();

// Apply protect and adminOnly middleware to all admin routes
router.use(protect, adminOnly);

// Add validation for pagination (optional, reasonable defaults)
router.get(
  "/users",
  [
    query("page").optional().isInt({ gt: 0 }).toInt(),
    query("limit").optional().isInt({ gt: 0 }).toInt(),
  ],
  getAllUsers
);

// Add validation for ID and credits
router.put(
  "/user/:id/credits",
  [param("id").isMongoId(), body("credits").isNumeric()],
  updateUserCredits
);

router.get("/top-users", getTopUsers); // No input validation needed here

router.get("/top-saved-feeds", getTopSavedFeeds); // No input validation needed here

module.exports = router;
