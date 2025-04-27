// routes/authRoutes.js
const express = require("express");
const {
  register,
  login,
  refreshToken,
} = require("../controllers/authController");
const { body } = require("express-validator"); // Import validation

const router = express.Router();

router.post(
  "/register",
  [
    // Add validation rules
    body("name", "Name is required").notEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  register
);

router.post(
  "/login",
  [
    // Add validation rules
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  login
);

// Refresh token relies on cookie, less need for body validation here
router.get("/refresh-token", refreshToken);

module.exports = router;
