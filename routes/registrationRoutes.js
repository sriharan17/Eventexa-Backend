const express = require("express");
const Registration = require("../models/Registration");
const crypto = require("crypto");
const { authenticate, adminOnly, studentOnly } = require("../middleware/authMiddleware");
const { sendCertificateEmail } = require("../utils/mailer");

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
      message: "Certificates generated",
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

module.exports = router;