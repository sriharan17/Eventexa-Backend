import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { deleteAllRegistrations, getAllRegistrations } from "../../services/api";
import "./RegisteredStudents.css";

function RegisteredStudents() {
  const [registrations,setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,setError] = useState("");
  const [issuingId, setIssuingId] = useState("");
  const [generatingAll, setGeneratingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [notice, setNotice] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [retryingRegistrationEmails, setRetryingRegistrationEmails] = useState(false);
  const [checkingEmailService, setCheckingEmailService] = useState(false);

  const updateAttendance = async (registrationId, status) => {
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/registrations/${registrationId}/attendance`, { status });
      setRegistrations((current) => current.map((item) =>
        item._id === registrationId ? { ...item, ...response.data.registration } : item
      ));
      setNotice(`Attendance updated: ${status}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update attendance.");
    }
  };

  useEffect(() => {
    let isActive = true;

    getAllRegistrations()
      .then((response) => {
        if (isActive) {
          setRegistrations(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load registered students. Please try again."
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleIssueCertificate = async (registration) => {
    setIssuingId(registration._id);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/registrations/${registration._id}/certificate`);
      setRegistrations((current) => current.map((item) => (
        item._id === registration._id ? { ...item, ...response.data.registration } : item
      )));
      setNotice(response.data.message || "Certificate email sent.");
    } catch (requestError) {
      if (requestError.response?.data?.registration) {
        setRegistrations((current) => current.map((item) => (
          item._id === registration._id ? { ...item, ...requestError.response.data.registration } : item
        )));
      }
      setError(requestError.response?.data?.message || "Unable to issue certificate.");
    } finally {
      setIssuingId("");
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/registrations/certificates/generate-all");
      if (response.data.emailFailedCount > 0) {
        setError(response.data.message);
      } else {
        setNotice(response.data.message || "Certificate email processing completed.");
      }
      const registrationsResponse = await getAllRegistrations();
      setRegistrations(Array.isArray(registrationsResponse.data) ? registrationsResponse.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate certificates.");
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      `Permanently delete all ${registrations.length} registration records and their certificate data? Student accounts will remain.`
    );
    if (!confirmed) return;

    setDeletingAll(true);
    setError("");
    setNotice("");
    try {
      const response = await deleteAllRegistrations();
      setRegistrations([]);
      setNotice(`Deleted ${response.data.deletedCount} registration record${response.data.deletedCount === 1 ? "" : "s"}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete registrations.");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleSendFeedbackForms = async () => {
    setSendingFeedback(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/registrations/feedback/send-all");
      if (response.data.failedCount > 0 || response.data.missingFormCount > 0) {
        setError(response.data.message || "Some feedback emails could not be sent.");
      } else {
        setNotice(response.data.message || "Feedback forms were sent.");
      }
      const registrationsResponse = await getAllRegistrations();
      setRegistrations(Array.isArray(registrationsResponse.data) ? registrationsResponse.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send feedback forms.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleRetryRegistrationEmails = async () => {
    setRetryingRegistrationEmails(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/registrations/emails/registrations/retry");
      if (response.data.failedCount > 0) {
        setError(response.data.message);
      } else {
        setNotice(response.data.message);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to retry registration emails.");
    } finally {
      setRetryingRegistrationEmails(false);
    }
  };

  const handleCheckEmailService = async () => {
    setCheckingEmailService(true);
    setError("");
    setNotice("");
    try {
      const response = await api.get("/registrations/email/status");
      setNotice(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Email service check failed.");
    } finally {
      setCheckingEmailService(false);
    }
  };

  const pendingCertificateCount = registrations.filter(
    (registration) => registration.attendanceStatus === "present"
      && (!registration.certificateId || registration.certificateEmailSent !== true)
  ).length;
  const feedbackRecords = registrations.filter(
    (registration) => registration.feedbackSubmittedAt && registration.feedbackText
  );

  return (
    <div className="registered-students-page">
      <aside className="registered-sidebar">
        <Link to="/admin-dashboard" className="registered-brand">
          <span className="registered-brand-mark" aria-hidden="true" />
          <span>Eventexa</span>
        </Link>

        <nav className="registered-nav" aria-label="Admin navigation">
          <Link to="/admin-dashboard">Dashboard</Link>
          <Link to="/add-event">Add Event</Link>
          <Link to="/manage-events">Manage Events</Link>
          <Link to="/registered-students" className="active" aria-current="page">
            Registered Students
          </Link>
        </nav>

        <Link to="/" className="registered-logout">
          Log out
        </Link>
      </aside>

      <main className="registered-content">
        <header className="registered-header">
          <div>
            <h1>Registered Students</h1>
            <p>View registrations. Add a Google feedback form link to each event before sending feedback.</p>
          </div>
          <div className="registered-header-actions">
            <button
              type="button"
              className="generate-all-certificates-btn"
              onClick={handleCheckEmailService}
              disabled={loading || checkingEmailService}
            >
              {checkingEmailService ? "Checking email..." : "Check email service"}
            </button>
            <button
              type="button"
              className="generate-all-certificates-btn"
              onClick={handleRetryRegistrationEmails}
              disabled={loading || retryingRegistrationEmails}
            >
              {retryingRegistrationEmails ? "Retrying..." : "Retry registration emails"}
            </button>
            <button
              type="button"
              className="generate-all-certificates-btn"
              onClick={handleGenerateAll}
              disabled={loading || generatingAll || pendingCertificateCount === 0}
            >
              {generatingAll ? "Generating..." : `Generate & email all certificates (${pendingCertificateCount})`}
            </button>
            <button
              type="button"
              className="generate-all-certificates-btn"
              onClick={handleSendFeedbackForms}
              disabled={loading || sendingFeedback || registrations.filter((item) => item.attendanceStatus === "present").length === 0}
            >
              {sendingFeedback ? "Sending feedback..." : "Send feedback form"}
            </button>
            <button
              type="button"
              className="delete-all-registrations-btn"
              onClick={handleDeleteAll}
              disabled={loading || deletingAll || registrations.length === 0}
            >
              {deletingAll ? "Deleting..." : `Delete all registrations (${registrations.length})`}
            </button>
            <div className="registered-count" aria-live="polite">
              {registrations.length} {registrations.length === 1 ? "registration" : "registrations"}
            </div>
          </div>
        </header>

        {notice && <p className="certificate-generation-notice" role="status">{notice}</p>}
        {error && <p className="certificate-generation-error" role="alert">{error}</p>}

        <section className="registered-card" aria-label="Student registrations">
          {loading ? (
            <p className="registered-message" role="status">
              Loading registrations...
            </p>
          ) : error && registrations.length === 0 ? (
            <p className="registered-message registered-error" role="alert">
              {error}
            </p>
          ) : registrations.length === 0 ? (
            <p className="no-registrations">
              No students have registered for events yet.
            </p>
          ) : (
            <div className="registered-table-wrap">
              <table className="registered-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Registration No.</th>
                    <th scope="col">Email</th>
                    <th scope="col">Event</th>
                    <th scope="col">Attendance</th>
                    <th scope="col">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration._id}>
                      <td>{registration.studentName || "—"}</td>
                      <td>{registration.regNo || "—"}</td>
                      <td>{registration.studentEmail || "—"}</td>
                      <td>{registration.eventName || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className={registration.attendanceStatus === "present" ? "issue-certificate-btn" : ""}
                            onClick={() => updateAttendance(registration._id, "present")}
                            style={{
                              background: registration.attendanceStatus === "present" ? "#1e9d5a" : "#e8f5ee",
                              color: registration.attendanceStatus === "present" ? "#fff" : "#1e9d5a",
                              border: "1px solid #1e9d5a",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={registration.attendanceStatus === "absent" ? "delete-all-registrations-btn" : ""}
                            onClick={() => updateAttendance(registration._id, "absent")}
                            style={{
                              background: registration.attendanceStatus === "absent" ? "#d14a4a" : "#fce8e8",
                              color: registration.attendanceStatus === "absent" ? "#fff" : "#d14a4a",
                              border: "1px solid #d14a4a",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td>
                        {registration.attendanceStatus !== "present" ? (
                          <span style={{ color: "#777", fontStyle: "italic" }}>
                            {registration.attendanceStatus === "absent" ? "Blocked" : "Pending"}
                          </span>
                        ) : registration.certificateId ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span className="certificate-issued">
                              {registration.certificateEmailSent === true ? "Issued · email sent" : "Issued · email unconfirmed"}
                            </span>
                            {registration.certificateEmailSent !== true && (
                              <button
                                type="button"
                                className="issue-certificate-btn"
                                onClick={() => handleIssueCertificate(registration)}
                                disabled={issuingId === registration._id}
                              >
                                {issuingId === registration._id ? "Sending..." : "Retry email"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="issue-certificate-btn"
                            onClick={() => handleIssueCertificate(registration)}
                            disabled={issuingId === registration._id}
                          >
                            {issuingId === registration._id ? "Issuing..." : "Generate & email"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="registered-card feedback-records-card" aria-labelledby="feedback-records-title">
          <div className="feedback-records-heading">
            <div>
              <h2 id="feedback-records-title">Student Feedback Records</h2>
              <p>Feedback submitted by students for attended events.</p>
            </div>
            <span className="registered-count">
              {feedbackRecords.length} {feedbackRecords.length === 1 ? "response" : "responses"}
            </span>
          </div>

          {loading ? (
            <p className="registered-message" role="status">Loading feedback records...</p>
          ) : feedbackRecords.length === 0 ? (
            <p className="no-registrations">No student feedback has been submitted yet.</p>
          ) : (
            <div className="registered-table-wrap">
              <table className="registered-table feedback-records-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Email</th>
                    <th scope="col">Event</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Feedback</th>
                    <th scope="col">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackRecords.map((record) => {
                    const eventName = record.eventId?.title
                      || record.eventId?.name
                      || record.eventName
                      || "Campus event";
                    const submittedDate = new Date(record.feedbackSubmittedAt);

                    return (
                      <tr key={record._id}>
                        <td>{record.studentName || "—"}</td>
                        <td>{record.studentEmail || "—"}</td>
                        <td>{eventName}</td>
                        <td>{record.feedbackRating ? `${record.feedbackRating}/5` : "—"}</td>
                        <td className="feedback-record-text">{record.feedbackText}</td>
                        <td>
                          {Number.isNaN(submittedDate.getTime())
                            ? "—"
                            : submittedDate.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default RegisteredStudents;