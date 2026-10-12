import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../../services/api";
import "./StudentFeedback.css";

function StudentFeedback() {
  const { registrationId } = useParams();
  const location = useLocation();
  const studentToken = localStorage.getItem("studentToken");
  const [requests, setRequests] = useState([]);
  const [request, setRequest] = useState(null);
  const [rating, setRating] = useState("5");
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(Boolean(studentToken));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!studentToken) return undefined;
    let active = true;

    const loadRequest = registrationId
      ? api.get(`/registrations/feedback/${registrationId}`)
      : api.get("/registrations/feedback/my");

    loadRequest
      .then((response) => {
        if (!active) return;
        if (registrationId) {
          setRequest(response.data);
          if (response.data.feedbackSubmittedAt) {
            setRating(String(response.data.feedbackRating || 5));
            setFeedbackText(response.data.feedbackText || "");
          }
        } else {
          setRequests(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load feedback.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [registrationId, studentToken]);

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!registrationId) return;

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/registrations/feedback/${registrationId}`, {
        rating: Number(rating),
        feedbackText,
      });
      setRequest(response.data.registration);
      setNotice(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const eventName = (item) =>
    item.eventId?.title || item.eventId?.name || item.eventName || "Campus event";
  const isCurrentRequestLoaded = request?._id === registrationId;
  const isLoading = loading
    || Boolean(studentToken && registrationId && !isCurrentRequestLoaded && !error);
  const loginUrl = `/student-login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  return (
    <main className="student-feedback-page">
      <header className="student-feedback-header">
        <Link to="/student-dashboard" className="student-feedback-brand">
          <span aria-hidden="true">E</span> Eventexa
        </Link>
        <Link to="/student-dashboard" className="student-feedback-back">← Student dashboard</Link>
      </header>

      <section className="student-feedback-content">
        <p className="student-feedback-eyebrow">YOUR VOICE MATTERS</p>
        <h1>{registrationId ? "Share your feedback." : "Event feedback."}</h1>
        <p className="student-feedback-intro">
          Feedback requests sent by your event admin appear here. You can also use the Google Form link in the email.
        </p>

        {notice && <p className="feedback-notice" role="status">{notice}</p>}
        {error && <p className="feedback-error" role="alert">{error}</p>}

        {isLoading ? (
          <p role="status">Loading feedback requests...</p>
        ) : !studentToken ? (
          <div className="feedback-empty-state">
            <p>Log in with your student account to view and submit feedback.</p>
            <Link to={loginUrl} className="feedback-primary-link">Student login</Link>
          </div>
        ) : registrationId && isCurrentRequestLoaded ? (
          <article className="feedback-form-card">
            <p className="feedback-event-label">EVENT FEEDBACK</p>
            <h2>{eventName(request)}</h2>
            {request.feedbackSubmittedAt ? (
              <div className="feedback-submitted-message" role="status">
                <strong>Thank you for sharing your feedback.</strong>
                <p>Your rating: {request.feedbackRating}/5</p>
                <p>{request.feedbackText}</p>
              </div>
            ) : (
              <form onSubmit={submitFeedback}>
                <label className="feedback-field">
                  <span>Your rating</span>
                  <select
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                    disabled={submitting}
                  >
                    {[5, 4, 3, 2, 1].map((score) => (
                      <option key={score} value={score}>{score} {score === 1 ? "star" : "stars"}</option>
                    ))}
                  </select>
                </label>
                <label className="feedback-field">
                  <span>Tell us about your experience</span>
                  <textarea
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    placeholder="What did you enjoy? What could be improved?"
                    maxLength={2000}
                    rows={6}
                    required
                    disabled={submitting}
                  />
                  <small>{feedbackText.length}/2000 characters</small>
                </label>
                <button
                  className="feedback-submit-button"
                  type="submit"
                  disabled={submitting || !feedbackText.trim()}
                >
                  {submitting ? "Submitting..." : "Submit feedback"}
                </button>
              </form>
            )}
          </article>
        ) : requests.length ? (
          <div className="feedback-request-list">
            {requests.map((item) => (
              <article className="feedback-request-card" key={item._id}>
                <div>
                  <p className="feedback-event-label">
                    {item.feedbackSubmittedAt ? "SUBMITTED" : "FEEDBACK REQUESTED"}
                  </p>
                  <h2>{eventName(item)}</h2>
                  <p>{item.feedbackSubmittedAt ? "Your feedback has been recorded." : "Share your experience at this event."}</p>
                </div>
                <Link to={`/student-feedback/${item._id}`} className="feedback-primary-link">
                  {item.feedbackSubmittedAt ? "View feedback" : "Give feedback"}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="feedback-empty-state">
            <h2>No feedback requests yet</h2>
            <p>When an admin sends you a feedback request, it will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default StudentFeedback;
