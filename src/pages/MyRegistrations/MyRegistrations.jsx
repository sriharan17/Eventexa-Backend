import { useEffect, useState } from "react";
import "./MyRegistrations.css";
import api from "../../services/api";

const reloadIfRegistrationSyncPending = () => {
  const pendingSync = localStorage.getItem("eventRegistrationSyncNeeded");
  if (!pendingSync) return;

  localStorage.removeItem("eventRegistrationSyncNeeded");
  window.location.reload();
};

function MyRegistrations() {
  const studentToken = localStorage.getItem("studentToken");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(Boolean(studentToken));
  const [error, setError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    if (!studentToken) return;

    reloadIfRegistrationSyncPending();

    let isActive = true;

    const fetchRegistrations = (showNotice = false) => {
      api.get("/registrations/my")
        .then((response) => {
          if (isActive) {
            setRegistrations(response.data);
            if (showNotice) {
              setSyncNotice("Registration synced. Your latest updates are visible.");
            }
          }
        })
        .catch((requestError) => {
          if (isActive) {
            setError(requestError.response?.data?.message || "Failed to load registrations.");
          }
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });
    };

    const pendingSync = localStorage.getItem("eventRegistrationSyncNeeded");
    if (pendingSync) {
      localStorage.removeItem("eventRegistrationSyncNeeded");
    }

    fetchRegistrations(Boolean(pendingSync));

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        const pendingRefresh = localStorage.getItem("eventRegistrationSyncNeeded");
        if (pendingRefresh) {
          localStorage.removeItem("eventRegistrationSyncNeeded");
        }
        fetchRegistrations(Boolean(pendingRefresh));
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

  useEffect(() => {
    if (!syncNotice) return undefined;

    const timer = setTimeout(() => setSyncNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [syncNotice]);

  return (
    <div className="my-registrations-page">

      <div className="container py-5">

        {/* Header */}
        {syncNotice && (
          <div
            role="status"
            style={{
              marginBottom: "16px",
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

        <div className="mb-4">
          <h1 className="registrations-title">
            My Registrations
          </h1>

          <p className="registrations-subtitle">
            View the campus events you have registered for.
          </p>
        </div>

        <div className="row g-4">
          {loading ? (
            <p role="status">Loading registrations...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : !studentToken ? (
            <p role="alert">Please log in to view your registrations.</p>
          ) : registrations.length === 0 ? (
            <p>You have not completed registration for any events yet.</p>
          ) : registrations.map((registration) => {
            const event = registration.eventId || {};
            const eventDate = event.date ? new Date(event.date) : null;
            const hasValidDate = eventDate && !Number.isNaN(eventDate.getTime());

            return (
              <div className="col-12 col-lg-6" key={registration._id}>
                <div className="registration-card h-100">
                  <div className="d-flex align-items-start gap-3">
                    <div className="registration-date">
                      {hasValidDate ? (
                        <>
                          <strong>{eventDate.getDate()}</strong>
                          <span>{eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                        </>
                      ) : (
                        <span>EVENT</span>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h2>{event.title || event.name || registration.eventName}</h2>
                      {(event.venue || event.location) && <p>📍 {event.venue || event.location}</p>}
                      {(event.startTime || event.time) && <p>⏰ {event.startTime || event.time}</p>}
                    </div>
                  </div>
                  <div className="registration-bottom">
                    <span className="registration-status">✓ Registered</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

export default MyRegistrations;