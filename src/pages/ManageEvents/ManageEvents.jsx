import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageEvents.css";
import api from "../../services/api";

function ManageEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingFeedbackId, setSavingFeedbackId] = useState("");

  useEffect(() => {
    api.get("/events")
      .then((response) => setEvents(response.data))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Failed to load events");
      });
  }, []);

  const handleFeedbackLinkChange = (id, feedbackFormLink) => {
    setEvents((currentEvents) => currentEvents.map((event) => (
      event._id === id ? { ...event, feedbackFormLink } : event
    )));
  };

  const handleSaveFeedbackLink = async (event) => {
    setSavingFeedbackId(event._id);
    setError("");
    setNotice("");

    try {
      const response = await api.put(`/events/${event._id}`, {
        feedbackFormLink: event.feedbackFormLink.trim(),
      });
      setEvents((currentEvents) => currentEvents.map((currentEvent) => (
        currentEvent._id === event._id
          ? { ...currentEvent, ...response.data.event }
          : currentEvent
      )));
      setNotice(`Google feedback form saved for ${event.title || event.name}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save the Google feedback form link.");
    } finally {
      setSavingFeedbackId("");
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);
      setEvents((currentEvents) => currentEvents.filter((event) => event._id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete event");
    }
  };

  return (
    <div className="manage-events-page">

      <div className="container py-5">

        {/* ================= HEADER ================= */}

        <div className="manage-events-header">

          <div>
            <h1>Manage Events</h1>

            <p>
              View and manage all campus events.
            </p>
          </div>

          <button
            className="add-event-btn"
            onClick={() => navigate("/add-event")}
          >
            + Add Event
          </button>

        </div>


        {/* ================= EVENTS ================= */}

        {error && <p className="error-message">{error}</p>}
        {notice && <p className="feedback-link-notice" role="status">{notice}</p>}

        {events.length === 0 ? (

          <div className="no-events">

            <div className="no-events-icon">
              📅
            </div>

            <h2>No Events Yet</h2>

            <p>
              You haven't added any events yet.
            </p>

            <button
              className="add-event-btn"
              onClick={() => navigate("/add-event")}
            >
              + Add Your First Event
            </button>

          </div>

        ) : (

          <div className="events-grid">

            {events.map((event) => (

              <div
                className="event-card"
                key={event._id}
              >

                {/* Event Category */}
                <span className="event-category">
                  {event.category}
                </span>


                {/* Event Name */}
                <h2>
                  {event.title || event.name}
                </h2>


                {/* Description */}
                <p className="event-description">
                  {event.description}
                </p>


                {/* Event Details */}

                <div className="event-details">

                  <div>
                    📅
                    <span>
                      {event.date}
                    </span>
                  </div>

                  <div>
                    ⏰
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>

                  <div>
                    📍
                    <span>
                      {event.venue || event.location}
                    </span>
                  </div>

                  <div>
                    👤
                    <span>
                      {event.organizer}
                    </span>
                  </div>

                </div>


                {/* Participants */}

                {event.maxParticipants && (
                  <p className="participants">
                    👥 Maximum Participants:{" "}
                    {event.maxParticipants}
                  </p>
                )}


                {/* Registration Link */}

                {event.registrationLink && (
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="registration-link"
                  >
                    View Registration Form
                  </a>
                )}

                <form
                  className="feedback-link-editor"
                  onSubmit={(submitEvent) => {
                    submitEvent.preventDefault();
                    handleSaveFeedbackLink(event);
                  }}
                >
                  <label htmlFor={`feedback-form-${event._id}`}>Google feedback form</label>
                  <input
                    id={`feedback-form-${event._id}`}
                    type="url"
                    value={event.feedbackFormLink || ""}
                    onChange={(changeEvent) => handleFeedbackLinkChange(event._id, changeEvent.target.value)}
                    placeholder="https://forms.google.com/..."
                    required
                  />
                  <button
                    type="submit"
                    className="save-feedback-link-btn"
                    disabled={savingFeedbackId === event._id || !event.feedbackFormLink?.trim()}
                  >
                    {savingFeedbackId === event._id ? "Saving..." : "Save Google Form"}
                  </button>
                </form>

                {event.feedbackFormLink && (
                  <a
                    href={event.feedbackFormLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="registration-link"
                  >
                    View Feedback Form
                  </a>
                )}


                {/* Actions */}

                <div className="event-actions">

                  <button
                    className="delete-event-btn"
                    onClick={() =>
                      handleDelete(event._id)
                    }
                  >
                    Delete Event
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}


        {/* Back Button */}

        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Back to Admin Dashboard
        </button>

      </div>

    </div>
  );
}

export default ManageEvents;