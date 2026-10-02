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
    regNo: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Registration || mongoose.model("Registration", registrationSchema);