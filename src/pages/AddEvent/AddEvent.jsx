import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddEvent.css";
import api from "../../services/api"

function AddEvent() {
  const navigate = useNavigate();

  const [event, setEvent] = useState({
    title: "",
    category: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    registrationLink: "",
    feedbackFormLink: "",
    maxParticipants: "",
    organizer: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEvent({
      ...event,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setMessage("");
      setError("");
      await api.post("/events", {
        ...event,
        maxParticipants: event.maxParticipants
          ? Number(event.maxParticipants)
          : undefined,
      });
      setMessage("Event added successfully!");
      navigate("/manage-events");
    } catch (error) {
      console.error("Add event error:", error);
      const responseError = error.response?.data;
      setError(
        responseError?.error
          ? `${responseError.message}: ${responseError.error}`
          : responseError?.message || "Failed to add event"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-event-page">

      <div className="container py-5">

        {/* Header */}
        <div className="add-event-header mb-4">

          <h1>Add New Event</h1>

          <p>
            Create and publish a new campus event.
          </p>

        </div>

        {message && <div className="success-message">{message}</div>}

        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <div className="add-event-card">

          <form onSubmit={handleSubmit}>

            {/* ================= EVENT INFORMATION ================= */}

            <div className="form-section">

              <h2>Event Information</h2>

              <div className="row g-4">

                {/* Event Name */}
                <div className="col-12">

                  <label>
                    Event Name
                  </label>

                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Enter event name"
                    value={event.title}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* Category */}
                <div className="col-12 col-md-6">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    className="form-select"
                    value={event.category}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    <option value="Technical">
                      Technical
                    </option>

                    <option value="Cultural">
                      Cultural
                    </option>

                    <option value="Sports">
                      Sports
                    </option>

                    <option value="Workshop">
                      Workshop
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>


                {/* Organizer */}
                <div className="col-12 col-md-6">

                  <label>
                    Organizer Name
                  </label>

                  <input
                    type="text"
                    name="organizer"
                    className="form-control"
                    placeholder="Enter organizer name"
                    value={event.organizer}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* Description */}
                <div className="col-12">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    placeholder="Enter event description"
                    value={event.description}
                    onChange={handleChange}
                    required
                  ></textarea>

                </div>

              </div>

            </div>


            {/* ================= DATE & TIME ================= */}

            <div className="form-section">

              <h2>Date & Time</h2>

              <div className="row g-4">

                {/* Date */}
                <div className="col-12 col-md-4">

                  <label>
                    Event Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={event.date}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* Start Time */}
                <div className="col-12 col-md-4">

                  <label>
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="startTime"
                    className="form-control"
                    value={event.startTime}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* End Time */}
                <div className="col-12 col-md-4">

                  <label>
                    End Time
                  </label>

                  <input
                    type="time"
                    name="endTime"
                    className="form-control"
                    value={event.endTime}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>


            {/* ================= VENUE ================= */}

            <div className="form-section">

              <h2>Venue</h2>

              <div className="row">

                <div className="col-12">

                  <label>
                    Event Venue
                  </label>

                  <input
                    type="text"
                    name="venue"
                    className="form-control"
                    placeholder="Example: Main Auditorium"
                    value={event.venue}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>


            {/* ================= REGISTRATION ================= */}

            <div className="form-section">

              <h2>Registration</h2>

              <div className="row g-4">

                {/* Google Form */}
                <div className="col-12">

                  <label>
                    Google Form Registration Link
                  </label>

                  <input
                    type="url"
                    name="registrationLink"
                    className="form-control"
                    placeholder="https://forms.google.com/..."
                    value={event.registrationLink}
                    onChange={handleChange}
                    required
                  />

                  <small>
                    Students will use this link to register for the event.
                  </small>

                </div>


                {/* Maximum Participants */}
                <div className="col-12 col-md-6">

                  <label>
                    Maximum Participants
                  </label>

                  <input
                    type="number"
                    name="maxParticipants"
                    className="form-control"
                    placeholder="Example: 100"
                    min="1"
                    value={event.maxParticipants}
                    onChange={handleChange}
                  />

                </div>

                <div className="col-12">
                  <label>
                    Feedback Google Form Link (Optional)
                  </label>

                  <input
                    type="url"
                    name="feedbackFormLink"
                    className="form-control"
                    placeholder="https://forms.google.com/..."
                    value={event.feedbackFormLink}
                    onChange={handleChange}
                  />

                  <small>
                    This can be sent to present participants after the event ends.
                  </small>
                </div>

              </div>

            </div>


            {/* ================= BUTTONS ================= */}

            <div className="add-event-actions">

              <button
                type="button"
                className="cancel-event-btn"
                onClick={() => navigate("/admin-dashboard")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-event-btn"
                disabled = {loading}
              >
                {loading ? "Adding Event...": "Add Event"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default AddEvent;