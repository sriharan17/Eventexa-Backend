const express = require("express");
const Registration = require("../models/Registration");
const Admin = require("../models/Admin");
const crypto = require("crypto");
const { authenticate, adminOnly, studentOnly } = require("../middleware/authMiddleware");
const {
  sendCertificateEmail,
  sendEventFeedbackEmail,
  sendFeedbackSubmissionEmail,
} = require("../utils/mailer");

const router = express.Router();

router.post("/:eventId/register", authenticate, studentOnly, (req, res) => {
  return res.status(410).json({
    message: "Register through the event's Google Form. Your registration is recorded after you submit it.",
  });
});

router.get("/my", authenticate, studentOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({ studentId: req.user.id })
      .sort({ registeredAt: -1 })
      .populate("eventId", "title name date venue location startTime time");

    return res.status(200).json(registrations);
  } catch (error) {
    console.error("Student registrations lookup error:", error);
    return res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

router.post("/certificates/generate-all", authenticate, adminOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({
      attendanceStatus: "present",
      $or: [
        { certificateId: { $exists: false } },
        { certificateId: null },
        { certificateId: "" },
      ],
    });

    for (const registration of registrations) {
      registration.certificateId = `EVX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
      registration.certificateIssuedAt = new Date();
      await registration.save();

      try {
        await sendCertificateEmail(registration);
      } catch (emailError) {
        console.error("Certificate email failed:", emailError.message);
      }
    }

    return res.status(200).json({
      message: "Certificates generated for present attendees",
      issuedCount: registrations.length,
    });
  } catch (error) {
    console.error("Bulk certificate issuance error:", error);
    return res.status(500).json({ message: "Failed to generate certificates" });
  }
});

router.get("/certificates/my", authenticate, studentOnly, async (req, res) => {
  try {
    const certificates = await Registration.find({
      studentId: req.user.id,
      certificateId: { $exists: true, $ne: "" },
    })
      .sort({ certificateIssuedAt: -1 })
      .populate("eventId", "title name date venue location");

    return res.status(200).json(certificates);
  } catch (error) {
    console.error("Student certificates lookup error:", error);
    return res.status(500).json({ message: "Failed to fetch certificates" });
  }
});

router.post("/:registrationId/certificate", authenticate, adminOnly, async (req, res) => {
  try {
    const { registrationId } = req.params;
    if (!/^[a-f\d]{24}$/i.test(registrationId)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.attendanceStatus !== "present") {
      return res.status(400).json({
        message: "Certificate can only be issued to students marked present.",
      });
    }

    if (!registration.certificateId) {
      registration.certificateId = `EVX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
      registration.certificateIssuedAt = new Date();
      await registration.save();

      try {
        await sendCertificateEmail(registration);
      } catch (emailError) {
        console.error("Certificate email failed:", emailError.message);
      }
    }

    return res.status(200).json({ message: "Certificate issued", registration });
  } catch (error) {
    console.error("Certificate issuance error:", error);
    return res.status(500).json({ message: "Failed to issue certificate" });
  }
});

router.post("/:registrationId/attendance", authenticate, adminOnly, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    if (!/^[a-f\d]{24}$/i.test(registrationId)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    if (!status || !["present", "absent"].includes(status)) {
      return res.status(400).json({ message: "Attendance status must be present or absent." });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.attendanceStatus = status;
    registration.markedAt = new Date();
    registration.markedBy = req.user.id;

    if (status === "absent") {
      registration.certificateId = undefined;
      registration.certificateIssuedAt = undefined;
      registration.feedbackSent = false;
      registration.feedbackSentAt = undefined;
    }

    await registration.save();

    return res.status(200).json({
      message: `Student marked as ${status}`,
      registration,
    });
  } catch (error) {
    console.error("Attendance update error:", error);
    return res.status(500).json({ message: "Failed to update attendance" });
  }
});

router.post("/feedback/send-all", authenticate, adminOnly, async (req, res) => {
  try {
    const Event = require("../models/Event");
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
    if (!frontendUrl) {
      return res.status(503).json({ message: "Student feedback page URL is not configured." });
    }

    const registrations = await Registration.find({
      attendanceStatus: "present",
      feedbackSent: { $ne: true },
    }).sort({ registeredAt: -1 });

    let sentCount = 0;
    let failedCount = 0;
    const eventIds = [...new Set(registrations.map((registration) => String(registration.eventId)))];
    const eventMap = new Map();

    for (const eventId of eventIds) {
      const event = await Event.findById(eventId);
      if (event) {
        eventMap.set(String(event._id), event);
      }
    }

    for (const registration of registrations) {
      const event = eventMap.get(String(registration.eventId));
      if (!event) continue;

      const student = { name: registration.studentName, email: registration.studentEmail };
      try {
        const feedbackUrl = `${frontendUrl}/student-feedback/${registration._id}`;
        await sendEventFeedbackEmail(student, event, feedbackUrl);
        registration.feedbackSent = true;
        registration.feedbackSentAt = new Date();
        registration.feedbackRequestedBy = req.user.id;
        await registration.save();
        sentCount += 1;
      } catch (mailError) {
        console.error("Feedback email failed:", mailError.message);
        failedCount += 1;
      }
    }

    return res.status(200).json({
      message: failedCount
        ? `Feedback form sent to ${sentCount} attendee${sentCount === 1 ? "" : "s"}; email delivery failed for ${failedCount}.`
        : `Feedback form sent to ${sentCount} present attendee${sentCount === 1 ? "" : "s"}.`,
      sentCount,
      totalCandidates: registrations.length,
      failedCount,
    });
  } catch (error) {
    console.error("Feedback dispatch error:", error);
    return res.status(500).json({ message: "Failed to send feedback forms" });
  }
});

router.get("/feedback/my", authenticate, studentOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({
      studentId: req.user.id,
      attendanceStatus: "present",
      feedbackSent: true,
    })
      .sort({ feedbackSentAt: -1 })
      .populate("eventId", "title name date venue location");

    return res.status(200).json(registrations);
  } catch (error) {
    console.error("Student feedback lookup error:", error);
    return res.status(500).json({ message: "Failed to fetch feedback requests" });
  }
});

router.get("/feedback/:registrationId", authenticate, studentOnly, async (req, res) => {
  try {
    const { registrationId } = req.params;
    if (!/^[a-f\d]{24}$/i.test(registrationId)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    const registration = await Registration.findOne({
      _id: registrationId,
      studentId: req.user.id,
      attendanceStatus: "present",
      feedbackSent: true,
    }).populate("eventId", "title name date venue location");

    if (!registration) {
      return res.status(404).json({ message: "Feedback request not found" });
    }

    return res.status(200).json(registration);
  } catch (error) {
    console.error("Feedback request lookup error:", error);
    return res.status(500).json({ message: "Failed to fetch feedback request" });
  }
});

router.post("/feedback/:registrationId", authenticate, studentOnly, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const rating = Number(req.body.rating);
    const feedbackText = typeof req.body.feedbackText === "string"
      ? req.body.feedbackText.trim()
      : "";

    if (!/^[a-f\d]{24}$/i.test(registrationId)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }
    if (!feedbackText || feedbackText.length > 2000) {
      return res.status(400).json({ message: "Feedback must be between 1 and 2000 characters." });
    }

    const registration = await Registration.findOne({
      _id: registrationId,
      studentId: req.user.id,
      attendanceStatus: "present",
      feedbackSent: true,
    });

    if (!registration) {
      return res.status(404).json({ message: "Feedback request not found" });
    }
    if (registration.feedbackNotificationSent) {
      return res.status(409).json({ message: "Feedback has already been submitted." });
    }

    if (!registration.feedbackSubmittedAt) {
      registration.feedbackRating = rating;
      registration.feedbackText = feedbackText;
      registration.feedbackSubmittedAt = new Date();
      await registration.save();
    }

    const admin = registration.feedbackRequestedBy
      ? await Admin.findById(registration.feedbackRequestedBy)
      : null;
    if (!admin) {
      return res.status(503).json({
        message: "Your feedback was saved, but its requesting admin could not be found.",
        registration,
      });
    }

    try {
      await sendFeedbackSubmissionEmail(admin, registration);
    } catch (emailError) {
      console.error("Feedback notification email failed:", emailError);
      return res.status(503).json({
        message: "Your feedback was saved, but the admin email notification failed. Submit again to retry the notification.",
        registration,
      });
    }

    registration.feedbackNotificationSent = true;
    await registration.save();

    return res.status(200).json({
      message: "Thank you. Your feedback was submitted and the admin was notified.",
      registration,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
});

module.exports = router;