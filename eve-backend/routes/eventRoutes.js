const express = require("express");
const axios = require("axios");

const Event = require("../models/Event");

const {
  authenticate,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();
const editableEventFields = [
  "title",
  "name",
  "category",
  "date",
  "time",
  "startTime",
  "endTime",
  "venue",
  "location",
  "seats",
  "maxParticipants",
  "description",
  "organizer",
  "formUrl",
  "googleFormUrl",
  "registrationLink",
  "feedbackFormLink"
];

const getTodayDateString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};

const getFormIntegrationConfig = () => {
  const scriptUrl = process.env.APPS_SCRIPT_URL || process.env.EVENTEXA_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET || process.env.EVENTEXA_SCRIPT_SETUP_SECRET;
  const webhookSecret = process.env.GOOGLE_FORM_WEBHOOK_SECRET;
  const backendUrl = process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL;

  if (!scriptUrl || !secret || !webhookSecret || !backendUrl) {
    const error = new Error(
      "Google Form integration is not configured. Set APPS_SCRIPT_URL, APPS_SCRIPT_SECRET, GOOGLE_FORM_WEBHOOK_SECRET, and PUBLIC_API_URL."
    );
    error.statusCode = 503;
    throw error;
  }

  const normalizedBackendUrl = backendUrl.replace(/\/+$/, "").replace(/\/api$/, "");
  return {
    scriptUrl,
    secret,
    webhookSecret,
    webhookUrl: `${normalizedBackendUrl}/api/registrations/form-webhook`
  };
};

const callAppsScript = async (payload) => {
  const { scriptUrl } = getFormIntegrationConfig();
  const response = await axios.post(scriptUrl, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 20000
  });

  if (response.data?.success !== true) {
    throw new Error(response.data?.message || "Apps Script rejected the request.");
  }
  return response.data;
};

const createGoogleForm = async (event) => {
  const config = getFormIntegrationConfig();
  const response = await axios.post(
    config.scriptUrl,
    {
      action: "createForm",
      secret: config.secret,
      webhookUrl: config.webhookUrl,
      webhookSecret: config.webhookSecret,
      eventId: event._id.toString(),
      title: event.title,
      description: event.description
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    }
  );

  if (response.data?.success !== true || typeof response.data.formUrl !== "string") {
    throw new Error(response.data?.message || "Apps Script did not return a registration form URL.");
  }
  return response.data.formUrl;
};

const registerGoogleForm = async (formUrl, eventId) => {
  const match = formUrl.match(/\/d\/(?:e\/)?([^/]+)/);
  if (!match) {
    throw new Error("The supplied registration link is not a valid Google Form URL.");
  }

  const config = getFormIntegrationConfig();
  await callAppsScript({
    action: "registerForm",
    formId: match[1],
    eventId: eventId.toString(),
    setupSecret: config.secret,
    webhookUrl: config.webhookUrl,
    webhookSecret: config.webhookSecret
  });
};


// ======================================================
// GET ALL EVENTS
// Students + Admins can view
// ======================================================

router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 });

    res.status(200).json(events);

  } catch (error) {

    console.error("Failed to fetch events:", error.message);

    res.status(500).json({
      message: "Failed to fetch events",
      error: error.message
    });
  }
});

router.get("/admin", authenticate, adminOnly, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id })
      .sort({ date: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch your events",
      error: error.message
    });
  }
});


// ======================================================
// GET SINGLE EVENT
// Students + Admins can view
// ======================================================

router.get("/:id", async (req, res) => {
  try {

    const event = await Event.findById(
      req.params.id
    );

    if (!event || event.date < getTodayDateString()) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.status(200).json(event);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch event",
      error: error.message
    });
  }
});


// ======================================================
// CREATE EVENT
// ADMIN ONLY
// ======================================================

router.post(
  "/",
  authenticate,
  adminOnly,
  async (req, res) => {

    try {

      const {
        title,
        category,
        description,
        date,
        venue,
        organizer,
        startTime,
        endTime,
        formUrl,
        googleFormUrl,
        registrationLink,
        feedbackFormLink,
        maxParticipants

      } = req.body;

      if (
        !title ||
        !description ||
        !date ||
        !venue ||
        !organizer
      ) {
        return res.status(400).json({
          message: "Title, description, date, venue, and organizer are required"
        });
      }

      const event = new Event({
        title,
        category,
        description,
        date,
        venue,
        organizer,
        startTime,
        endTime,
        formUrl: formUrl || googleFormUrl || registrationLink,
        googleFormUrl: googleFormUrl || registrationLink || formUrl,
        registrationLink: registrationLink || googleFormUrl || formUrl,
        feedbackFormLink,
        maxParticipants,
        createdBy: req.user.id
      });

      if (event.formUrl) {
        await registerGoogleForm(event.formUrl, event._id);
      } else {
        event.formUrl = await createGoogleForm(event);
        event.googleFormUrl = event.formUrl;
        event.registrationLink = event.formUrl;
      }

      const savedEvent = await event.save();

      res.status(201).json({
        success: "true",
        message: "Event created successfully",
        event: savedEvent
      });

    } catch (error) {

      console.error(
        "Event creation failed:",
        error.response?.data?.message || error.message
      );

      res.status(error.statusCode || 500).json({
        message: "Failed to create event",
        error: error.message
      });
    }
  }
);


// ======================================================
// UPDATE EVENT
// ADMIN ONLY
// ======================================================

router.put(
  "/:id",
  authenticate,
  adminOnly,
  async (req, res) => {

    try {

      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([field]) => editableEventFields.includes(field))
      );

      const event =
        await Event.findOneAndUpdate(
          { _id: req.params.id, createdBy: req.user.id },
          updates,
          {
            new: true,
            runValidators: true
          }
        );

      if (!event) {
        return res.status(404).json({
          message: "Event not found"
        });
      }

      res.status(200).json({
        message: "Event updated successfully",
        event
      });

    } catch (error) {

      res.status(500).json({
        message: "Failed to update event",
        error: error.message
      });
    }
  }
);


// ======================================================
// DELETE EVENT
// ADMIN ONLY
// ======================================================

router.delete(
  "/:id",
  authenticate,
  adminOnly,
  async (req, res) => {

    try {

      const event = await Event.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user.id
      });

      if (!event) {
        return res.status(404).json({
          message: "Event not found"
        });
      }

      res.status(200).json({
        message: "Event deleted successfully"
      });

    } catch (error) {

      res.status(500).json({
        message: "Failed to delete event",
        error: error.message
      });
    }
  }
);


module.exports = router;