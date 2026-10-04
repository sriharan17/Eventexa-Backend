import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AllEvents.css";
import api from "../../services/api";

const markPendingRegistrationSync = () => {
  localStorage.setItem("eventRegistrationSyncNeeded", Date.now().toString());
};

const reloadIfRegistrationSyncPending = () => {
  const pendingSync = localStorage.getItem("eventRegistrationSyncNeeded");
  if (!pendingSync) return;

  localStorage.removeItem("eventRegistrationSyncNeeded");
  window.location.reload();
};

const isUpcomingEvent = (event) => {
  if (!event?.date) return false;

  const dateValue = event.date.length === 10 ? `${event.date}T00:00:00` : event.date;
  const eventDate = new Date(dateValue);
  return !Number.isNaN(eventDate.getTime()) && eventDate >= new Date(new Date().setHours(0, 0, 0, 0));
};

function AllEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    let isActive = true;

    reloadIfRegistrationSyncPending();

    const fetchEventsAndRegistrations = async (showNotice = false) => {
      try {
        const [eventsResponse, registrationsResponse] = await Promise.all([
          api.get("/events"),
          localStorage.getItem("studentToken")
            ? api.get("/registrations/my")
            : Promise.resolve({ data: [] }),
        ]);
        if (isActive) {
          setEvents((eventsResponse.data || []).filter(isUpcomingEvent));
          setRegistrations(registrationsResponse.data);
          if (showNotice) {
            setSyncNotice("Registration synced. Your latest updates are visible.");
          }
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || "Failed to load events.");
        }
      }
    };

    fetchEventsAndRegistrations(Boolean(localStorage.getItem("eventRegistrationSyncNeeded")));

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        reloadIfRegistrationSyncPending();
        fetchEventsAndRegistrations(true);
      }
    };

    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("focus", refreshOnReturn);

    return () => {
      isActive = false;
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("focus", refreshOnReturn);
    };
  }, []);

  useEffect(() => {
    if (!syncNotice) return undefined;

    const timer = setTimeout(() => setSyncNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [syncNotice]);

  const handleRegister = (event) => {
    if (!localStorage.getItem("studentToken")) {
      navigate("/student-login");
      return;
    }

    setError("");
    if (!event.registrationLink) {
      setError("The registration form is not available for this event.");
      return;
    }

    markPendingRegistrationSync();
    window.location.assign(event.registrationLink);
  };


  return (
    <div className="all-events-page">

      {syncNotice && (
        <div
          role="status"
          style={{
            margin: "16px auto 0",
            maxWidth: "840px",
            background: "#e7f9ee",
            color: "#0f5132",
            border: "1px solid #badbcc",
            borderRadius: "10px",
            padding: "12px 16px",
            fontWeight: 600,
          }}
        >
          {syncNotice}
        </div>
      )}

      {/* Header */}
      <div className="all-events-header">

        <div>
          <h1>Campus Events</h1>

          <p>
            Discover and register for upcoming campus events.
          </p>
        </div>

      </div>


      {/* Events */}
      {error && <p role="alert">{error}</p>}
      {events.length === 0 ? (

        /* No Events */
        <div className="no-events">

          <div className="no-events-icon">
            🎉
          </div>

          <h2>No Events Available</h2>

          <p>
            There are no upcoming events at the moment.
            Please check back later.
          </p>

        </div>

      ) : (

        <div className="events-grid">

          {events.map((event) => (

            <div
              className="all-event-card"
              key={event._id || event.id}
            >

              {/* Top */}
              <div className="event-card-top">

                <span className="event-category">
                  {event.category}
                </span>

                <div className="event-date">

                  <strong>
                    {new Date(event.date).getDate()}
                  </strong>

                  <small>
                    {new Date(event.date)
                      .toLocaleString("en-US", {
                        month: "short",
                      })
                      .toUpperCase()}
                  </small>

                </div>

              </div>


              {/* Event Name */}
              <h2>
                {event.title || event.name}
              </h2>


              {/* Description */}
              <p className="event-description">
                {event.description}
              </p>


              {/* Event Information */}
              <div className="event-info">

                <span>
                  📍 {event.venue || event.location}
                </span>

                <span>
                  ⏰ {event.startTime}
                </span>

              </div>


              {/* Organizer */}
              {event.organizer && (
                <p className="event-organizer">
                  👤 {event.organizer}
                </p>
              )}


              {/* Register */}
              {registrations.some((registration) =>
                (registration.eventId?._id || registration.eventId) === (event._id || event.id)
              ) ? (
                <button type="button" className="event-register-btn is-registered" disabled>
                  Registered ✓
                </button>
              ) : (
                <button
                  type="button"
                  className="event-register-btn"
                  onClick={() => handleRegister(event)}
                  disabled={!event.registrationLink}
                >
                  {event.registrationLink ? "Register Now" : "Form unavailable"}
                </button>
              )}

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default AllEvents;