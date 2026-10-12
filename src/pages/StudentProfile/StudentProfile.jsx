import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../StudentDashboard/StudentDashboard.css";
import "./StudentProfile.css";

function StudentProfile() {
  const navigate = useNavigate();
  const studentToken = localStorage.getItem("studentToken");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(Boolean(studentToken));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentToken) return undefined;

    let isActive = true;
    api.get("/auth/student/profile")
      .then((response) => {
        if (isActive) setStudent(response.data.student);
      })
      .catch((requestError) => {
        if (isActive) {
          setError(requestError.response?.data?.message || "Unable to load your profile.");
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [studentToken]);

  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("studentToken");
    navigate("/student-login", { replace: true });
  };

  return (
    <div className="student-dashboard">
      <aside className="dashboard-sidebar">
        <Link to="/student-dashboard" className="student-profile-logo">
          <span className="dashboard-logo-icon" aria-hidden="true" />
          <span>Eventexa</span>
        </Link>

        <nav className="dashboard-nav" aria-label="Student navigation">
          <Link to="/student-dashboard">🏠 Dashboard</Link>
          <Link to="/all-events">🎉 All Events</Link>
          <Link to="/my-registrations">📝 My Registrations</Link>
          <Link to="/student-feedback">💬 Event Feedback</Link>
          <Link to="/event-e-certificates">🏅 Event E-Certificates</Link>
          <Link to="/student-profile" className="active" aria-current="page">👤 Profile</Link>
        </nav>

        <button className="dashboard-logout" onClick={handleLogout}>
          ↪ Logout
        </button>
      </aside>

      <main className="dashboard-main student-profile-main">
        <header className="dashboard-header">
          <div>
            <h1>My Profile</h1>
            <p>Your student information from the Eventexa database.</p>
          </div>
        </header>

        {!studentToken ? (
          <p className="student-profile-message" role="alert">
            Please <Link to="/student-login">log in</Link> to view your profile.
          </p>
        ) : loading ? (
          <p className="student-profile-message" role="status">Loading your profile...</p>
        ) : error ? (
          <p className="student-profile-message student-profile-error" role="alert">{error}</p>
        ) : student ? (
          <section className="student-profile-card" aria-labelledby="student-profile-name">
            <div className="student-profile-avatar" aria-hidden="true">🎓</div>
            <div>
              <p className="student-profile-label">STUDENT ACCOUNT</p>
              <h2 id="student-profile-name">{student.name}</h2>
              <dl className="student-profile-details">
                <div>
                  <dt>Full name</dt>
                  <dd>{student.name || "—"}</dd>
                </div>
                <div>
                  <dt>Registration number</dt>
                  <dd>{student.regNo || "—"}</dd>
                </div>
                <div>
                  <dt>Email address</dt>
                  <dd>{student.email || "—"}</dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default StudentProfile;
