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

const registerGoogleForm = async (formUrl, eventId) => {
  try {
    if (!formUrl) {
      return;
    }

    const match = formUrl.match(/\/d\/(?:e\/)?([^/]+)/);

    if (!match) {
      console.log("Could not extract Google Form ID from:", formUrl);
      return;
    }

    const formId = match[1];
    const scriptUrl = process.env.EVENTEXA_SCRIPT_URL;
    const setupSecret = process.env.EVENTEXA_SCRIPT_SETUP_SECRET;

    if (!scriptUrl || !setupSecret) {
      console.log("Apps Script environment variables are missing.");
      return;
    }

    const response = await axios.post(
      scriptUrl,
      {
        action: "registerForm",
        formId,
        eventId: eventId.toString(),
        setupSecret
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (response.data?.success !== true) {
      throw new Error(response.data?.message || "Apps Script rejected the form registration.");
    }

    console.log("Google Form connected:", response.data);
  } catch (error) {
    console.error(
      "Failed to connect Google Form:",
      error.response?.data || error.message
    );
  }
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

    console.error(error);

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
        !organizer ||
        !(googleFormUrl || registrationLink)
      ) {
        return res.status(400).json({
          message: "Title, description, date, venue, organizer, and Google Form URL are required"
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
        googleFormUrl: googleFormUrl || registrationLink,
        registrationLink: registrationLink || googleFormUrl,
        feedbackFormLink,
        maxParticipants,
        createdBy: req.user.id
      });

      const savedEvent = await event.save();

      await registerGoogleForm(
        savedEvent.googleFormUrl,
        savedEvent._id
      );

      res.status(201).json({
        success: "true",
        message: "Event created successfully",
        event: savedEvent
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
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