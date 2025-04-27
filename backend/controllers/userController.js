// controllers/userController.js
const User = require("../models/User");
const { validationResult } = require("express-validator");

exports.getUserDashboard = async (req, res, next) => {
  try {
    // req.user is already populated by 'protect' middleware
    // We just need to send the relevant parts
    const user = await User.findById(req.user.id).select(
      "name email role credits savedFeeds activity notifications lastLogin" // Select fields needed for dashboard
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json(user);
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

exports.saveFeed = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { feed } = req.body; // Contains title, url, source etc.
  const userId = req.user.id;

  try {
    // Use findOneAndUpdate to atomically check if feed URL already exists and push if not
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        "savedFeeds.url": { $ne: feed.url }, // Condition: URL must not exist in savedFeeds
      },
      {
        $push: {
          savedFeeds: {
            // Push the validated feed object
            title: feed.title,
            url: feed.url,
            source: feed.source,
            savedAt: new Date(),
          },
          activity: `Saved feed: ${feed.title} (+5 credits)`,
          notifications: {
            // Add structured notification
            message: `You saved feed: ${feed.title}`,
            type: "feed_saved",
            link: feed.url, // Optional link
            timestamp: new Date(),
          },
        },
        $slice: { notifications: -20 }, // Keep only the latest 20 notifications
        $inc: { credits: 5 }, // Increment credits atomically
      },
      {
        new: true, // Return the modified document if found and updated
        fields: "credits savedFeeds activity notifications", // Select only fields needed for response/confirmation
      }
    );

    if (!updatedUser) {
      // This means either the user wasn't found (unlikely if protected)
      // OR the feed URL already exists in the savedFeeds array
      const userExists = await User.findById(userId);
      if (!userExists) {
        res.status(404);
        throw new Error("User not found");
      }
      // If user exists, it means the feed was already saved
      res.status(400);
      throw new Error("Feed already saved");
    }

    // Send confirmation response
    res.json({
      message: "Feed saved and credits awarded",
      credits: updatedUser.credits, // Send updated credits
      // Optionally send back the updated savedFeeds array or just the confirmation
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

exports.shareFeed = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title } = req.body; // Get title from validated body
  const userId = req.user.id;

  try {
    // Atomically increment credits and push activity
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: 2 }, // Award 2 credits
        $push: { activity: `Shared feed: ${title} (+2 credits)` },
      },
      {
        new: true, // Return updated document
        fields: "credits activity", // Only return necessary fields
      }
    );

    if (!updatedUser) {
      res.status(404);
      throw new Error("User not found for sharing action");
    }

    res.json({
      message: "Feed shared and credits awarded",
      credits: updatedUser.credits, // Send updated credits
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

exports.spendCredits = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, purpose } = req.body; // amount is validated as positive integer
  const userId = req.user.id;

  try {
    // Use findOneAndUpdate with condition to ensure sufficient credits and decrement atomically
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        credits: { $gte: amount }, // Condition: Check if credits are >= amount
      },
      {
        $inc: { credits: -amount }, // Decrement credits atomically
        $push: { activity: `Spent ${amount} credits for: ${purpose}` },
      },
      {
        new: true, // Return the updated document
        fields: "credits activity", // Select needed fields
      }
    );

    if (!updatedUser) {
      // If update failed, it means the condition (credits >= amount) was not met
      const userExists = await User.findById(userId); // Check if user exists at all
      if (!userExists) {
        res.status(404);
        throw new Error("User not found");
      }
      // User exists, so credits must be insufficient
      res.status(400); // Bad request
      throw new Error("Not enough credits");
    }

    res.json({
      message: "Credits spent successfully",
      credits: updatedUser.credits, // Send updated credits
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

// GET User Notifications
exports.getUserNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("notifications"); // Select only notifications

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Return notifications, potentially sorted or sliced if needed
    // Notifications are stored newest first if pushed correctly
    res.json(user.notifications || []); // Return empty array if no notifications field
  } catch (error) {
    next(error); // Pass error to global handler
  }
};
