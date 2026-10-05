const express = require("express");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Admin = require("../models/Admin");
const crypto = require("crypto");
const { authenticate, adminOnly, studentOnly } = require("../middleware/authMiddleware");
const {
  sendCertificateEmail,
  sendFeedbackSubmissionEmail,
  sendEventRegistrationEmail,
  sendEventFeedbackEmail,
  verifyEmailConfiguration,
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

router.get("/email/status", authenticate, adminOnly, async (req, res) => {
  try {
    verifyEmailConfiguration();
    return res.status(200).json({ message: "Email service configuration is present." });
  } catch (error) {
    console.error("Email service verification failed:", error);
    return res.status(503).json({
      message: error.code === "EMAIL_NOT_CONFIGURED"
        ? "Backend email settings are missing GOOGLE_APPS_SCRIPT_URL or GOOGLE_APPS_SCRIPT_SECRET."
        : "Email service configuration check failed.",
      code: error.code || "EMAIL_SERVICE_UNAVAILABLE",
    });
  }
});

router.post("/emails/registrations/retry", authenticate, adminOnly, async (req, res) => {
  try {
    const Event = require("../models/Event");
    const registrations = await Registration.find({
      $or: [
        { registrationEmailSent: false },
        { registrationEmailSent: { $exists: false } },
      ],
    }).sort({ registeredAt: -1 });

    let sentCount = 0;
    let failedCount = 0;

    for (const registration of registrations) {
      const [event, student] = await Promise.all([
        Event.findById(registration.eventId),
        User.findById(registration.studentId),
      ]);
      if (!event || !student) {
        failedCount += 1;
        console.error(`Registration email retry skipped for ${registration._id}: event or student not found.`);
        continue;
      }

      try {
        await sendEventRegistrationEmail(student, event);
        registration.registrationEmailSent = true;
        await registration.save();
        sentCount += 1;
      } catch (emailError) {
        console.error(`Registration email retry failed for ${registration._id}:`, emailError);
        failedCount += 1;
      }
    }

    return res.status(200).json({
      message: `Registration confirmation emails sent: ${sentCount}. Failed: ${failedCount}.`,
      sentCount,
      failedCount,
      totalCandidates: registrations.length,
    });
  } catch (error) {
    console.error("Registration email retry error:", error);
    return res.status(500).json({ message: "Failed to retry registration emails" });
  }
});

router.post("/certificates/generate-all", authenticate, adminOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({
      attendanceStatus: "present",
      certificateEmailSent: { $ne: true },
    });

    let issuedCount = 0;
    let emailedCount = 0;
    let emailFailedCount = 0;
    for (const registration of registrations) {
      if (!registration.certificateId) {
        registration.certificateId = `EVX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
        registration.certificateIssuedAt = new Date();
        issuedCount += 1;
      }

      try {
        await sendCertificateEmail(registration);
        registration.certificateEmailSent = true;
        await registration.save();
        emailedCount += 1;
      } catch (emailError) {
        console.error(`Certificate email failed for registration ${registration._id}:`, emailError);
        registration.certificateEmailSent = false;
        await registration.save();
        emailFailedCount += 1;
      }
    }

    return res.status(200).json({
      message: `Generated ${issuedCount} certificate${issuedCount === 1 ? "" : "s"}; emailed ${emailedCount}; email failed for ${emailFailedCount}.`,
      issuedCount,
      emailedCount,
      emailFailedCount,
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
      registration.certificateEmailSent = false;
      await registration.save();
    }

    if (registration.certificateEmailSent !== true) {
      try {
        await sendCertificateEmail(registration);
        registration.certificateEmailSent = true;
        await registration.save();
      } catch (emailError) {
        console.error(`Certificate email failed for registration ${registration._id}:`, emailError);
        registration.certificateEmailSent = false;
        await registration.save();
        return res.status(503).json({
          message: emailError.name === "TimeoutError"
            ? "Certificate is saved, but the Google Apps Script request timed out. Check the web app deployment and retry."
            : `Certificate is saved, but its email could not be sent: ${emailError.message}`,
          emailSent: false,
          registration,
        });
      }
    }

    return res.status(200).json({
      message: "Certificate is issued and its email was sent.",
      emailSent: true,
      registration,
    });
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
    const registrations = await Registration.find({
      attendanceStatus: "present",
      feedbackSent: { $ne: true },
    }).sort({ registeredAt: -1 });

    let sentCount = 0;
    let failedCount = 0;
    let missingFormCount = 0;
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
      if (!event) {
        failedCount += 1;
        console.error(`Feedback request skipped: event ${registration.eventId} was not found.`);
        continue;
      }

      const student = { name: registration.studentName, email: registration.studentEmail };
      const googleFormUrl = event.feedbackFormLink;
      const appFeedbackUrl = frontendUrl
        ? `${frontendUrl}/student-feedback/${registration._id}`
        : null;
      if (!googleFormUrl && !appFeedbackUrl) {
        missingFormCount += 1;
        continue;
      }

      try {
        await sendEventFeedbackEmail(student, event, googleFormUrl, appFeedbackUrl);
        registration.feedbackSent = true;
        registration.feedbackSentAt = new Date();
        registration.feedbackRequestedBy = req.user.id;
        await registration.save();
        sentCount += 1;
      } catch (mailError) {
        console.error(`Feedback email failed for registration ${registration._id}:`, mailError);
        failedCount += 1;
      }
    }

    const messages = [];
    if (sentCount) {
      messages.push(`Sent Google feedback forms to ${sentCount} student${sentCount === 1 ? "" : "s"}.`);
    }
    if (missingFormCount) {
      messages.push(`${missingFormCount} event registration${missingFormCount === 1 ? " has" : "s have"} no Google feedback form link.`);
    }
    if (failedCount) {
      messages.push(`Email delivery failed for ${failedCount} student${failedCount === 1 ? "" : "s"}.`);
    }
    if (!registrations.length) {
      messages.push("There are no present students awaiting a feedback form.");
    }

    return res.status(200).json({
      message: messages.join(" "),
      sentCount,
      totalCandidates: registrations.length,
      failedCount,
      missingFormCount,
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
    }).sort({ feedbackSentAt: -1 })
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
    if (registration.feedbackSubmittedAt) {
      return res.status(409).json({ message: "Feedback has already been submitted." });
    }

    registration.feedbackRating = rating;
    registration.feedbackText = feedbackText;
    registration.feedbackSubmittedAt = new Date();
    await registration.save();

    const admin = registration.feedbackRequestedBy
      ? await Admin.findById(registration.feedbackRequestedBy)
      : null;
    let adminNotified = false;
    if (admin) {
      try {
        await sendFeedbackSubmissionEmail(admin, registration);
        registration.feedbackAdminNotified = true;
        await registration.save();
        adminNotified = true;
      } catch (emailError) {
        console.error(`Admin feedback notification failed for registration ${registration._id}:`, emailError);
      }
    }

    return res.status(201).json({
      message: adminNotified
        ? "Your feedback has been submitted. Thank you!"
        : "Your feedback was saved, but the admin email notification could not be sent.",
      adminNotified,
      registration,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
});

module.exports = router;