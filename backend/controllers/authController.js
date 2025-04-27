// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator"); // Import validation result checker

exports.register = async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400); // Set status for error handler
      throw new Error("User already exists"); // Throw error
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user instance
    user = new User({
      name,
      email,
      password: hashedPassword,
      // Role defaults to 'user' in schema
    });

    // Save user to database
    await user.save();

    // User saved, now generate tokens
    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m", // Short-lived access token
    });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Longer-lived refresh token
    });

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict", // Helps mitigate CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: "/api/auth/refresh-token", // Only send cookie to refresh token path
    });

    // Send response (exclude password and refresh token from response body)
    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits, // Include initial credits
      },
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

exports.login = async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Explicitly select the password field which is normally excluded
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401); // Use 401 for authentication failures
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // --- Daily login bonus ---
    let dailyBonusAwarded = false;
    const today = new Date().toDateString();
    const lastLogin = user.lastLogin
      ? new Date(user.lastLogin).toDateString()
      : null;

    if (today !== lastLogin) {
      // Use atomic $inc for credits and $set for lastLogin and $push for activity
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: 10 }, // Award 10 credits atomically
        $set: { lastLogin: new Date() },
        $push: { activity: `Daily login bonus (+10 credits) on ${today}` }, // Add to activity log atomically
      });
      dailyBonusAwarded = true;
      // Note: user object in memory is now stale regarding credits/lastLogin. Fetch again or send known values if needed immediately.
      // For this response, we'll send the data as it was *before* the atomic update for simplicity,
      // but the DB is updated correctly. Alternatively, fetch the user again.
    } else {
      // If not awarding bonus, still update lastLogin if necessary (e.g., if login happens multiple times same day)
      // Only update if not already set today by the bonus logic above
      if (user.lastLogin?.toDateString() !== today) {
        await User.findByIdAndUpdate(user._id, {
          $set: { lastLogin: new Date() },
        });
      }
    }
    // --- End Daily login bonus ---

    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh-token",
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Reflect potential bonus in response if needed, requires fetching updated user or adding 10 manually
        credits: dailyBonusAwarded ? user.credits + 10 : user.credits,
      },
      // Optionally include a message about the bonus
      message: dailyBonusAwarded
        ? "Login successful. Daily bonus awarded!"
        : "Login successful.",
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

exports.refreshToken = async (req, res, next) => {
  // Made async to potentially check DB
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    return next(new Error("No refresh token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // **Optional but recommended:** Check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      return next(new Error("User not found for refresh token"));
    }
    // Add checks here if you have an 'isActive' flag: if (!user.isActive) { ... }

    // Generate new access token with potentially updated role from DB user object
    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.json({ accessToken });
  } catch (error) {
    // Handle expired or invalid refresh tokens specifically
    res.status(403); // Forbidden - refresh token is bad
    const refreshError = new Error(
      error.name === "TokenExpiredError"
        ? "Refresh token expired"
        : "Invalid refresh token"
    );
    refreshError.name = error.name;
    next(refreshError);
  }
};
