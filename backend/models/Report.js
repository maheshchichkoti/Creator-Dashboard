const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    post: { type: Object, required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, default: "Inappropriate content" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
