const express = require("express");
const crypto = require("crypto");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const { authenticate, adminOnly } = require("../middleware/authMiddleware");
const { sendEventRegistrationEmail } = require("../utils/mailer");

const router = express.Router();

router.post("/google-form-submit", async (req, res) => {
  try {
    const secret = process.env.GOOGLE_FORM_WEBHOOK_SECRET;
    const authorization = req.get("authorization") || "";
    const suppliedSecret = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!secret) {
      return res.status(503).json({ message: "Form submission callback is not configured" });
    }

    const secretBuffer = Buffer.from(secret);
    const suppliedBuffer = Buffer.from(suppliedSecret);
    if (
      secretBuffer.length !== suppliedBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, suppliedBuffer)
    ) {
      return res.status(401).json({ message: "Invalid callback authorization" });
    }

    const { eventId, studentEmail } = req.body;
    if (
      !eventId ||
      typeof studentEmail !== "string" ||
      !studentEmail.trim() ||
      !/^[a-f\d]{24}$/i.test(eventId)
    ) {
      return res.status(400).json({ message: "A valid event ID and student email are required" });
    }

    const [event, student] = await Promise.all([
      Event.findById(eventId),
      User.findOne({ email: studentEmail.trim().toLowerCase(), role: "student" })
    ]);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (!student) {
      return res.status(404).json({ message: "No student account matches this form email" });
    }

    const existingRegistration = await Registration.findOne({
      studentId: student._id,
      eventId: event._id
    });

    if (existingRegistration) {
      return res.status(200).json({
        message: "Registration already recorded",
        registration: existingRegistration
      });
    }

    const registration = new Registration({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      eventId: event._id,
      eventName: event.title || event.name,
      regNo: student.regNo,
      source: "google-form"
    });

    await registration.save();

    try {
      await sendEventRegistrationEmail(student, event);
    } catch (emailError) {
      console.error("Event registration email failed:", emailError.message);
    }

    res.status(201).json({ message: "Google Form registration recorded", registration });
  } catch (error) {
    console.error("Google Form registration callback error:", error);
    res.status(500).json({ message: "Failed to record form registration" });
  }
});

// GET ALL REGISTERED STUDENTS
router.get("/all", authenticate, adminOnly, async (req, res) => {
  try {
    const registrations = await Registration.find()
      .sort({ registeredAt: -1 })
      .populate("eventId", "title name date venue location startTime time");

    res.status(200).json(registrations);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch registrations"
    });
  }
});

router.delete("/all", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await Registration.deleteMany({});
    return res.status(200).json({
      message: "All event registrations deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk registration deletion error:", error);
    return res.status(500).json({ message: "Failed to delete registrations" });
  }
});

// GET REGISTRATIONS OF ONE STUDENT
router.get("/student/:studentId", async (req, res) => {
  try {
    const registrations = await Registration.find({
      studentId: req.params.studentId
    })
      .sort({ registeredAt: -1 })
      .populate("eventId", "title name date venue location startTime time");

    res.status(200).json(registrations);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch student registrations"
    });
  }
});

module.exports = router;