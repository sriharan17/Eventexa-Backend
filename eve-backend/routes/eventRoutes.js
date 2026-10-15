const express = require("express");

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
  "registrationLink",
  "feedbackFormLink"
];

const getTodayDateString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
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
        registrationLink,
        feedbackFormLink,
        maxParticipants,
        createdBy: req.user.id
      });

      const savedEvent = await event.save();

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