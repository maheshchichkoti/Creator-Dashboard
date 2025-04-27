// controllers/adminController.js
const User = require("../models/User");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose"); // Needed for Aggregation Pipeline

// GET all users with Pagination
exports.getAllUsers = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 }) // Example sort
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(); // Get total count for pagination info

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

// PUT update user credits (Atomic if using $inc, current is $set)
exports.updateUserCredits = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { credits } = req.body; // Assumes the request body sends { "credits": new_value }

  try {
    // Use findByIdAndUpdate which is atomic for the update operation itself.
    // NOTE: If you meant to ADD credits, use { $inc: { credits: credits } } instead of $set.
    // This implementation SETS the credits to the provided value.
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { credits: Number(credits) } }, // Ensure credits is a number
      { new: true, runValidators: true } // Return updated doc, run schema validators
    ).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found"); // Throw error for handler
    }

    res.json(user);
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

// GET Top 5 users by credits
exports.getTopUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ credits: -1 })
      .limit(5)
      .select("name email credits"); // Select specific fields

    res.json(users);
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

// GET Top 5 saved feeds using MongoDB Aggregation Pipeline
exports.getTopSavedFeeds = async (req, res, next) => {
  try {
    const topFeeds = await User.aggregate([
      // Stage 1: Deconstruct the savedFeeds array
      { $unwind: "$savedFeeds" },
      // Stage 2: Group by feed title and count occurrences
      {
        $group: {
          _id: "$savedFeeds.title", // Group by the title field within savedFeeds
          count: { $sum: 1 }, // Count how many times each title appears
        },
      },
      // Stage 3: Sort by count descending
      { $sort: { count: -1 } },
      // Stage 4: Limit to top 5
      { $limit: 5 },
      // Stage 5: Reshape the output documents
      {
        $project: {
          _id: 0, // Exclude the default _id field from the group stage
          title: "$_id", // Rename _id to title
          count: 1, // Include the count
        },
      },
    ]);

    res.json(topFeeds);
  } catch (error) {
    console.error("Aggregation Error:", error); // Log specific aggregation errors
    next(error); // Pass error to global handler
  }
};
