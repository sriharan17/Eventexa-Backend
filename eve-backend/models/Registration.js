const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["google-form", "click"],
      default: "click",
    },
    attendanceStatus: {
      type: String,
      enum: ["pending", "present", "absent"],
      default: "pending",
    },
    markedAt: Date,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
    },
    certificateIssuedAt: Date,
    certificateEmailSent: {
      type: Boolean,
    },
    registrationEmailSent: {
      type: Boolean,
    },
    feedbackSent: {
      type: Boolean,
      default: false,
    },
    feedbackSentAt: Date,
    regNo: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Registration || mongoose.model("Registration", registrationSchema);