// controllers/reportController.js
const Report = require("../models/Report");
const User = require("../models/User"); // Needed for notifications
const { validationResult } = require("express-validator");

exports.reportFeed = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // The 'post' object comes validated from the route
    const { post, reason } = req.body;
    const reportedBy = req.user.id; // From protect middleware

    const report = new Report({
      post: post, // Contains title, url etc. from request body
      reportedBy: reportedBy,
      reason: reason || "Inappropriate content", // Default reason if not provided
    });

    await report.save();

    // Add notification to the user who reported (Atomic)
    const notificationMessage = `You reported post: "${
      post.title || post.url
    }"`;
    await User.findByIdAndUpdate(reportedBy, {
      $push: {
        notifications: {
          message: notificationMessage,
          type: "report_confirmation", // Add type for frontend handling
          timestamp: new Date(),
        },
      },
      $slice: { notifications: -20 }, // Keep only the latest 20 notifications
    });

    res.status(201).json({ message: "Post reported successfully" });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};

exports.getReports = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  try {
    const reports = await Report.find()
      .populate("reportedBy", "name email") // Populate user details
      .sort({ createdAt: -1 }) // Show newest reports first
      .skip(skip)
      .limit(limit);

    const totalReports = await Report.countDocuments();

    res.json({
      reports,
      currentPage: page,
      totalPages: Math.ceil(totalReports / limit),
      totalReports,
    });
  } catch (error) {
    next(error); // Pass error to global handler
  }
};
