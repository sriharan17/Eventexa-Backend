import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./EventCertificates.css";

function EventCertificates() {
  const { registrationId } = useParams();
  const studentToken = localStorage.getItem("studentToken");
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(Boolean(studentToken));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentToken) return;

    let isActive = true;
    api.get("/registrations/certificates/my")
      .then((response) => {
        if (isActive) setCertificates(Array.isArray(response.data) ? response.data : []);
      })
      .catch((requestError) => {
        if (isActive) {
          setError(requestError.response?.data?.message || "Failed to load certificates.");
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [studentToken]);

  const selectedCertificate = certificates.find((item) => item._id === registrationId);
  const event = selectedCertificate?.eventId || {};
  const eventName = event.title || event.name || selectedCertificate?.eventName || "Campus Event";
  const eventDate = event.date ? new Date(event.date) : null;
  const issuedDate = selectedCertificate?.certificateIssuedAt
    ? new Date(selectedCertificate.certificateIssuedAt)
    : null;

  if (registrationId && selectedCertificate) {
    return (
      <main className="certificates-page certificate-detail-page">
        <header className="certificates-toolbar">
          <Link to="/event-e-certificates" className="certificates-back">
            <span aria-hidden="true">←</span> Your collection
          </Link>
          <span className="certificate-toolbar-label">EVENTEXA / VERIFIED RECORD</span>
          <button type="button" className="certificate-print-button" onClick={() => window.print()}>
            Print / Save PDF <span aria-hidden="true">↗</span>
          </button>
        </header>

        <article className="certificate-document" aria-label="Event participation certificate">
          <div className="certificate-inner-border">
            <div className="certificate-side-note" aria-hidden="true">A RECORD OF SHOWING UP</div>
            <p className="certificate-brand"><span className="certificate-brand-mark">E</span> EVENTEXA <span className="certificate-brand-divider">/</span> CAMPUS EVENTS</p>
            <div className="certificate-seal" aria-hidden="true"><span>EX</span></div>
            <p className="certificate-kicker">OFFICIAL EVENT RECORD <span>NO. {selectedCertificate.certificateId}</span></p>
            <h1>Certificate<span className="certificate-title-period">.</span></h1>
            <p className="certificate-presented">This certificate is proudly presented to</p>
            <h2>{selectedCertificate.studentName}</h2>
            <p className="certificate-copy">
              for taking part in <strong>{eventName}</strong>
              {eventDate && !Number.isNaN(eventDate.getTime())
                ? `, held ${eventDate.toLocaleDateString(undefined, { dateStyle: "long" })}`
                : ""}.
            </p>
            <div className="certificate-footer">
              <div>
                <strong>{issuedDate && !Number.isNaN(issuedDate.getTime())
                  ? issuedDate.toLocaleDateString(undefined, { dateStyle: "medium" })
                  : "Eventexa"}</strong>
                <span>Date issued</span>
              </div>
              <div className="certificate-signature" aria-label="Eventexa Administration">
                <strong>Eventexa Admin</strong>
                <span>Issued by Eventexa</span>
              </div>
              <div>
                <strong>{selectedCertificate.regNo || "Event participant"}</strong>
                <span>Student record</span>
              </div>
            </div>
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="certificates-page">
      <header className="certificate-collection-topbar">
        <Link to="/student-dashboard" className="certificate-wordmark">
          <span className="certificate-wordmark-mark">E</span>
          <span>eventexa<span className="wordmark-period">.</span></span>
        </Link>
        <Link to="/student-dashboard" className="certificates-back">
          <span aria-hidden="true">←</span> Student dashboard
        </Link>
      </header>

      <section className="certificate-hero" aria-labelledby="certificate-page-title">
        <div className="certificate-hero-copy">
          <p className="certificate-list-eyebrow"><span /> THE EVENTEXA ARCHIVE</p>
          <h1 id="certificate-page-title">Moments that<br />made it official<span>.</span></h1>
          <p className="certificate-hero-description">
            A collection of the events you showed up for, recognized and remembered.
          </p>
        </div>
        <div className="certificate-hero-art" aria-hidden="true">
          <div className="hero-paper hero-paper-back" />
          <div className="hero-paper hero-paper-front">
            <span className="hero-paper-rule" />
            <span className="hero-paper-title">CERTIFICATE</span>
            <span className="hero-paper-name">Your name, in print.</span>
            <span className="hero-paper-seal">EX</span>
          </div>
          <div className="hero-serial">ISSUED<br />WITH PURPOSE</div>
        </div>
      </section>

      <section className="certificate-collection" aria-labelledby="certificate-collection-title">
        <div className="certificate-section-heading">
          <div>
            <p>YOUR PARTICIPATION</p>
            <h2 id="certificate-collection-title">Issued certificates</h2>
          </div>
          <span className="certificate-total"><strong>{String(certificates.length).padStart(2, "0")}</strong> CREDENTIALS</span>
        </div>

      {loading ? (
        <p className="certificate-message" role="status">Loading certificates...</p>
      ) : error ? (
        <p className="certificate-message certificate-error" role="alert">{error}</p>
      ) : !studentToken ? (
        <p className="certificate-message" role="alert">
          Please <Link to="/student-login">log in</Link> to view your certificates.
        </p>
      ) : certificates.length === 0 ? (
        <div className="certificate-empty-state">
          <div className="empty-state-mark" aria-hidden="true">EX</div>
          <div>
            <p className="empty-state-overline">NOT YET IN THE ARCHIVE</p>
            <h3>Your next milestone is waiting.</h3>
            <p>Once an event organizer issues your certificate, it will appear here.</p>
          </div>
        </div>
      ) : (
        <section className="certificate-list" aria-label="Issued event certificates">
          {certificates.map((certificate, index) => {
            const certificateEvent = certificate.eventId || {};
            const name = certificateEvent.title || certificateEvent.name || certificate.eventName;
            const date = certificateEvent.date ? new Date(certificateEvent.date) : null;

            return (
              <article className="certificate-card" key={certificate._id}>
                <div className="certificate-card-art">
                  <div className="certificate-card-paper">
                    <div className="card-paper-topline"><span>EVENTEXA</span><span>NO. {String(index + 1).padStart(2, "0")}</span></div>
                    <span className="card-paper-overline">CERTIFICATE OF PARTICIPATION</span>
                    <strong className="card-paper-name">{certificate.studentName}</strong>
                    <span className="card-paper-rule" />
                    <span className="card-paper-event">{name || "Campus Event"}</span>
                    <span className="card-paper-seal">EX</span>
                  </div>
                  <span className="certificate-card-index">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="certificate-card-details">
                  <div className="certificate-card-copy">
                    <p>{date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { dateStyle: "medium" }) : "EVENT PARTICIPATION"}</p>
                    <h3>{name || "Campus Event"}</h3>
                    <span className="certificate-card-id">ID / {certificate.certificateId}</span>
                  </div>
                  <Link to={`/event-e-certificates/${certificate._id}`} className="certificate-view-link" aria-label={`View certificate for ${name || "Campus Event"}`}>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
      </section>
    </main>
  );
}

export default EventCertificates;