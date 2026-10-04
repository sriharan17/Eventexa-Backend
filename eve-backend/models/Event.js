const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String },
  category: { type: String, default: "General" },
  date: { type: String, required: true },
  time: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  venue: { type: String },
  location: { type: String },
  seats: { type: Number, default: 0 },
  maxParticipants: { type: Number },
  description: { type: String },
  organizer: { type: String },
  registrationLink: { type: String },
  feedbackFormLink: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

eventSchema.pre("save", function() {
  if (!this.name && this.title) this.name = this.title;
  if (!this.title && this.name) this.title = this.name;
  if (!this.venue && this.location) this.venue = this.location;
  if (!this.location && this.venue) this.location = this.venue;
  if (!this.startTime && this.time) this.startTime = this.time;
  if (!this.time && this.startTime) this.time = this.startTime;
});

module.exports = mongoose.model("Event", eventSchema);