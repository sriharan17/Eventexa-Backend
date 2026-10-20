import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

function RegistrationSuccess() {
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const confirmRegistration = async () => {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        setError("Please sign in again, then reopen this Eventexa return link.");
        return;
      }

      let pendingRegistration;
      try {
        pendingRegistration = JSON.parse(
          localStorage.getItem("eventexaPendingRegistration") || "null"
        );
      } catch {
        pendingRegistration = null;
      }

      if (!/^[a-f\d]{24}$/i.test(pendingRegistration?.eventId || "")) {
        setError("No recent pending registration was found. Return to Eventexa and try again.");
        return;
      }

      try {
        await api.post("/registrations/register", {
          eventId: pendingRegistration.eventId,
        });
        localStorage.removeItem("eventexaPendingRegistration");
        if (isActive) {
          navigate("/student-dashboard", {
            replace: true,
            state: { registrationSuccess: true },
          });
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || "Could not confirm your registration.");
        }
      }
    };

    confirmRegistration();

    return () => {
      isActive = false;
    };
  }, [navigate, retryCount]);

  return (
    <main style={{ maxWidth: "640px", margin: "12vh auto", padding: "24px" }}>
      {error ? (
        <>
          <h1>Registration not confirmed</h1>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
          <p><Link to="/all-events">Back to events</Link></p>
        </>
      ) : (
        <p role="status">Confirming your registration...</p>
      )}
    </main>
  );
}

export default RegistrationSuccess;
