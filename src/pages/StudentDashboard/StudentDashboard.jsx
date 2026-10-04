import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./StudentDashboard.css";
import { useNavigate } from "react-router-dom";
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(eventDate.getTime()) && eventDate >= today;
};

function StudentDashboard() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem("student") || "null");
  const studentToken = localStorage.getItem("studentToken");
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    reloadIfRegistrationSyncPending();

    const fetchEvents = async () => {
      try {
        const response = await api.get("/events");
        if (isActive) setEvents((response.data || []).filter(isUpcomingEvent));
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || "Failed to load events");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    const fetchRegistrations = async (showNotice = false) => {
      if (!studentToken) {
        setRegistrations([]);
        return;
      }

      try {
        const response = await api.get("/registrations/my");
        if (isActive) {
          setRegistrations(response.data);
          if (showNotice) {
            setError("");
          }
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || "Failed to load registrations");
        }
      }
    };

    fetchEvents();
    fetchRegistrations(Boolean(localStorage.getItem("eventRegistrationSyncNeeded")));

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        reloadIfRegistrationSyncPending();
        fetchRegistrations(true);
      }
    };

    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("focus", refreshOnReturn);

    return () => {
      isActive = false;
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("focus", refreshOnReturn);
    };
  }, [studentToken]);

  const handleRegister = (event) => {
    if (!studentToken) {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events
    .filter((event) => {
      if (!event.date) return false;
      const dateValue = event.date.length === 10
        ? `${event.date}T00:00:00`
        : event.date;
      const eventDate = new Date(dateValue);
      return !Number.isNaN(eventDate.getTime()) && eventDate >= today;
    })
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("student");
  localStorage.removeItem("studentToken");
  navigate("/student-login", { replace: true });
  };

  

  return (
    <div className="student-dashboard">

      {/* Sidebar */}
      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          <div className="dashboard-logo-icon"></div>
          <h2>Eventexa</h2>
        </div>

        <nav className="dashboard-nav">
          <a href="#" className="active">🏠 Dashboard</a>
          <Link to="/all-events">🎉 All Events</Link>
          <Link to="/my-registrations">📝 My Registrations</Link>
          <Link to="/event-e-certificates">🏅 Event E-Certificates</Link>
          <a href="#">📢 Announcements</a>
          <a href="#">👤 Profile</a>
        </nav>

        <button className="dashboard-logout" onClick={handleLogout}>
          ↪ Logout
        </button>

      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        <div className="dashboard-header">
          <div>
            <h1>{`Welcome, ${student?.name || "Student"}!`} 👋</h1>
            <p>Discover and participate in exciting campus events.</p>
          </div>

          <div className="student-profile">
            🎓
          </div>
        </div>

        {/* Statistics */}
        <div className="row g-4 dashboard-stats">

          <div className="col-12 col-md-4">
            <div className="stat-card">
              <div className="stat-icon">🎉</div>
              <div>
                <h3>{events.length}</h3>
                <p>Total Events</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div>
                <h3>{registrations.length}</h3>
                <p>Registered Events</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div>
                <h3>{upcomingEvents.length}</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
          </div>

        </div>

        {/* Upcoming Events */}
        <section className="upcoming-events">

          <div className="section-heading">
            <div>
              <h2>Upcoming Events</h2>
              <p>Don't miss these upcoming campus events.</p>
            </div>

            <button className="view-all-btn" onClick={() => navigate("/all-events")}>
              View All
            </button>
          </div>

          <div className="row g-4">
            {loading ? (
              <p role="status">Loading events...</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : upcomingEvents.length === 0 ? (
              <p>No upcoming campus events.</p>
            ) : (
              upcomingEvents.slice(0, 3).map((event) => {
                const eventDate = new Date(
                  event.date.length === 10 ? `${event.date}T00:00:00` : event.date
                );

                return (
                  <div className="col-12 col-md-6 col-lg-4" key={event._id || event.id}>
                    <div className="event-card">
                      <div className="event-date">
                        <span>{eventDate.getDate()}</span>
                        <small>{eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase()}</small>
                      </div>

                      <div className="event-content">
                        <span className="event-category">
                          {event.category || "General"}
                        </span>
                        <h3>{event.title || event.name}</h3>
                        <p>📍 {event.venue || event.location}</p>
                        <p>⏰ {event.startTime || event.time}</p>
                        {registrations.some((registration) =>
                          (registration.eventId?._id || registration.eventId) === (event._id || event.id)
                        ) ? (
                          <button className="register-btn is-registered" disabled>
                            Registered ✓
                          </button>
                        ) : (
                          <button
                            className="register-btn"
                            onClick={() => handleRegister(event)}
                            disabled={!event.registrationLink}
                          >
                            {event.registrationLink ? "Register" : "Form unavailable"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </section>

      </main>

    </div>
  );
}

export default StudentDashboard;