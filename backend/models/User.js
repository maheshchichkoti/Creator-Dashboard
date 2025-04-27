// models/User.js
const mongoose = require("mongoose");

// Define a more structured notification schema (can be separate if complex)
const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: { type: String }, // e.g., 'feed_saved', 'report_confirmation', 'daily_bonus', 'admin_message'
    link: { type: String }, // Optional link related to the notification
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
); // Don't create separate _id for each notification subdocument

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        // Basic email format validation
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6, // Enforce min length in schema
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    credits: {
      type: Number,
      default: 0,
      min: [0, "Credits cannot be negative"], // Add minimum validation
    },
    savedFeeds: [
      // Structure saved feeds
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        source: { type: String },
        savedAt: { type: Date, default: Date.now },
        _id: false, // Don't add an _id to each saved feed item
      },
    ],
    // Limit activity array size to prevent unbounded growth
    activity: [{ type: String }], // Consider capping this with $slice in updates if needed
    lastLogin: {
      type: Date,
    },
    // Use the structured notification schema
    notifications: [notificationSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    // Capped collection for activity (alternative if using $push with $slice is complex)
    // capped: { size: 100000, max: 1000, autoIndexId: true } // Example for activity log
  }
);

// Index for faster email lookup (unique constraint already adds one, but explicit is fine)
// userSchema.index({ email: 1 });
// Index for sorting/querying by credits
userSchema.index({ credits: -1 });
// Index for querying savedFeeds URLs efficiently if needed (compound index)
userSchema.index({ _id: 1, "savedFeeds.url": 1 });

// Limit the size of the activity array on save (less atomic than $slice)
// userSchema.pre('save', function(next) {
//   const maxActivity = 50; // Keep latest 50 activity items
//   if (this.activity.length > maxActivity) {
//     this.activity = this.activity.slice(this.activity.length - maxActivity);
//   }
//   next();
// });

// You might add a similar pre-save hook for notifications if not using $slice in updates

module.exports = mongoose.model("User", userSchema);
