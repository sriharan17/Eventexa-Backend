import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";
import api, { getAllRegistrations } from "../../services/api";

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let isActive = true;

    Promise.allSettled([
      api.get("/events"),
      getAllRegistrations()
    ]).then(([eventsResult, registrationsResult]) => {
      if (!isActive) return;

      if (eventsResult.status === "fulfilled") {
        setEvents(Array.isArray(eventsResult.value.data) ? eventsResult.value.data : []);
      } else {
        console.error("Failed to load dashboard events:", eventsResult.reason);
      }

      if (registrationsResult.status === "fulfilled") {
        setRegistrations(Array.isArray(registrationsResult.value.data) ? registrationsResult.value.data : []);
      } else {
        console.error("Failed to load dashboard registrations:", registrationsResult.reason);
      }

      if (eventsResult.status === "rejected" || registrationsResult.status === "rejected") {
        setDashboardError("Some dashboard data could not be loaded. Please refresh to try again.");
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  // Count upcoming events
  const upcomingEvents = events.filter((event) => {
    if (!event.date) return false;

    const today = new Date();
    const eventDate = new Date(event.date);

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate >= today;
  });

  const totalRegistrations = registrations.length;
  const presentCount = registrations.filter((registration) => registration.attendanceStatus === "present").length;
  const absentCount = registrations.filter((registration) => registration.attendanceStatus === "absent").length;
  const pendingCount = registrations.filter((registration) => !registration.attendanceStatus || registration.attendanceStatus === "pending").length;

  const eventAttendanceSummary = Object.values(
    registrations.reduce((summary, registration) => {
      const eventName = registration.eventName || "Unknown Event";
      if (!summary[eventName]) {
        summary[eventName] = {
          eventName,
          total: 0,
          present: 0,
          absent: 0,
          pending: 0,
        };
      }

      summary[eventName].total += 1;

      if (registration.attendanceStatus === "present") summary[eventName].present += 1;
      else if (registration.attendanceStatus === "absent") summary[eventName].absent += 1;
      else summary[eventName].pending += 1;

      return summary;
    }, {})
  ).sort((a, b) => b.total - a.total);

  return (
    <div className="admin-dashboard">

      {/* ================= SIDEBAR ================= */}

      <aside className="admin-sidebar">

        <div className="admin-logo">
          <div className="admin-logo-icon"></div>
          <h2>Eventexa</h2>
        </div>

        <nav className="admin-nav">

          <Link
            to="/admin-dashboard"
            className="active"
          >
            🏠 Dashboard
          </Link>

          <Link to="/add-event">
            ➕ Add Event
          </Link>

          <Link to="/manage-events">
            📋 Manage Events
          </Link>
          <Link to="/registered-students">
              👥 Registered Students
          </Link>

        </nav>

        <Link
          to="/"
          className="admin-logout"
        >
          ↩ Logout
        </Link>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <main className="admin-main">

        {/* Header */}

        <div className="admin-header">

          <div>
            <h1>Admin Dashboard</h1>

            <p>
              Manage your campus events from one place.
            </p>
          </div>

          <div className="admin-profile">
            👨‍💼 Admin
          </div>

        </div>

        {dashboardError && (
          <p className="dashboard-error" role="alert">
            {dashboardError}
          </p>
        )}

        <div className="container-fluid px-0">

          {/* ================= STATISTICS ================= */}

          <div className="row g-4">

            {/* Total Events */}

            <div className="col-12 col-md-6 col-lg-4">

              <div className="admin-stat-card">

                <div className="stat-icon">
                  🎉
                </div>

                <div>
                  <h3>{events.length}</h3>

                  <p>
                    Total Events
                  </p>
                </div>

              </div>

            </div>


            {/* Upcoming Events */}

            <div className="col-12 col-md-6 col-lg-4">

              <div className="admin-stat-card">

                <div className="stat-icon">
                  📅
                </div>

                <div>
                  <h3>
                    {upcomingEvents.length}
                  </h3>

                  <p>
                    Upcoming Events
                  </p>
                </div>

              </div>

            </div>


            {/* Registrations */}

            <div className="col-12 col-md-6 col-lg-4">

              <div className="admin-stat-card">

                <div className="stat-icon">
                  📝
                </div>

                <div>
                  <h3>{totalRegistrations}</h3>

                  <p>
                    Total Registrations
                  </p>
                </div>

              </div>

            </div>

          </div>

          <div className="admin-section">
            <div className="section-heading">
              <h2>Attendance Summary</h2>
            </div>

            <div className="attendance-summary-grid">
              <div className="attendance-summary-card present-card">
                <span className="attendance-label">Present</span>
                <strong>{presentCount}</strong>
              </div>

              <div className="attendance-summary-card absent-card">
                <span className="attendance-label">Absent</span>
                <strong>{absentCount}</strong>
              </div>

              <div className="attendance-summary-card pending-card">
                <span className="attendance-label">Pending</span>
                <strong>{pendingCount}</strong>
              </div>

              <div className="attendance-summary-card total-card">
                <span className="attendance-label">Registered</span>
                <strong>{totalRegistrations}</strong>
              </div>
            </div>

            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Registered</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {eventAttendanceSummary.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-attendance-data">No registration data yet.</td>
                    </tr>
                  ) : (
                    eventAttendanceSummary.map((entry) => (
                      <tr key={entry.eventName}>
                        <td>{entry.eventName}</td>
                        <td>{entry.total}</td>
                        <td>{entry.present}</td>
                        <td>{entry.absent}</td>
                        <td>{entry.pending}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* ================= QUICK ACTIONS ================= */}

          <div className="admin-section">

            <h2>
              Quick Actions
            </h2>

            <div className="row g-4">

              {/* Add Event */}

              <div className="col-12 col-md-6">

                <Link
                  to="/add-event"
                  className="admin-action-card"
                >

                  <div className="action-icon">
                    ➕
                  </div>

                  <div>

                    <h3>
                      Add New Event
                    </h3>

                    <p>
                      Create and publish a new
                      campus event.
                    </p>

                  </div>

                </Link>

              </div>


              {/* Manage Events */}

              <div className="col-12 col-md-6">

                <Link
                  to="/manage-events"
                  className="admin-action-card"
                >

                  <div className="action-icon">
                    📋
                  </div>

                  <div>

                    <h3>
                      Manage Events
                    </h3>

                    <p>
                      View or delete your
                      existing events.
                    </p>

                  </div>

                </Link>

              </div>

            </div>

          </div>


          {/* ================= RECENT EVENTS ================= */}

          <div className="admin-section">

            <div className="section-heading">

              <h2>
                Your Events
              </h2>

              <Link to="/manage-events">
                View All
              </Link>

            </div>


            {events.length === 0 ? (

              /* No Events */

              <div className="no-dashboard-events">

                <div className="no-dashboard-icon">
                  📅
                </div>

                <h3>
                  No Events Added Yet
                </h3>

                <p>
                  Start by creating your first
                  campus event.
                </p>

                <Link
                  to="/add-event"
                  className="dashboard-add-btn"
                >
                  + Add Event
                </Link>

              </div>

            ) : (

              /* Events */

              <div className="recent-events">

                {events
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((event) => (

                    <div
                      className="recent-event"
                      key={event._id}
                    >

                      <div className="recent-event-info">

                        <span className="dashboard-event-category">
                          {event.category}
                        </span>

                        <h3>
                          {event.title || event.name}
                        </h3>

                        <p>
                          📅 {event.date}
                          {" • "}
                          ⏰ {event.startTime}
                          {" - "}
                          {event.endTime}
                          {" • "}
                          📍 {event.venue || event.location}
                        </p>

                      </div>

                      <span className="event-status">
                        {event.date &&
                        new Date(event.date) >= new Date()
                          ? "Upcoming"
                          : "Completed"}
                      </span>

                    </div>

                  ))}

              </div>

            )}

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;