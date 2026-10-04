const express = require("express");
const Registration = require("../models/Registration");
const User = require("../models/User");
const crypto = require("crypto");
const { authenticate, adminOnly, studentOnly } = require("../middleware/authMiddleware");
const {
  sendCertificateEmail,
  sendEventRegistrationEmail,
  sendEventFeedbackEmail,
  verifyEmailTransport,
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
    await verifyEmailTransport();
    return res.status(200).json({ message: "Email service is configured and ready." });
  } catch (error) {
    console.error("Email service verification failed:", error);
    return res.status(503).json({
      message: error.code === "EMAIL_NOT_CONFIGURED"
        ? "Render is missing EMAIL_USER or EMAIL_PASS."
        : "Email service verification failed. Check the backend email credentials and provider logs.",
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
      $or: [
        { certificateId: { $exists: false } },
        { certificateId: null },
        { certificateId: "" },
        { certificateEmailSent: false },
        {
          $and: [
            { certificateId: { $exists: true, $nin: [null, ""] } },
            { certificateEmailSent: { $exists: false } },
          ],
        },
      ],
    });

    let issuedCount = 0;
    let emailedCount = 0;
    let emailFailedCount = 0;
    for (const registration of registrations) {
      if (!registration.certificateId) {
        registration.certificateId = `EVX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
        registration.certificateIssuedAt = new Date();
        registration.certificateEmailSent = false;
        issuedCount += 1;
        await registration.save();
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

    if (!registration.certificateEmailSent) {
      try {
        await sendCertificateEmail(registration);
        registration.certificateEmailSent = true;
        await registration.save();
      } catch (emailError) {
        console.error(`Certificate email failed for registration ${registration._id}:`, emailError);
        registration.certificateEmailSent = false;
        await registration.save();
        return res.status(503).json({
          message: "Certificate is saved, but its email could not be sent. Check the email service and retry.",
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
      if (!googleFormUrl) {
        missingFormCount += 1;
        continue;
      }

      try {
        await sendEventFeedbackEmail(student, event, googleFormUrl);
        registration.feedbackSent = true;
        registration.feedbackSentAt = new Date();
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

module.exports = router;