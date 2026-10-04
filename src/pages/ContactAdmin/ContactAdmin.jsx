import { Link } from "react-router-dom";
import "./ContactAdmin.css";

function ContactAdmin() {
  return (
    <div className="contact-admin-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">

            <div className="contact-admin-card">

              <div className="contact-admin-icon">
                👨‍💼
              </div>

              <h1>Contact Administrator</h1>

              <p className="contact-admin-subtitle">
                Need administrator access? Contact the Eventexa
                administration team.
              </p>

              <div className="admin-contact-details">

                <div className="admin-contact-item">
                  <div className="contact-item-icon">
                    📧
                  </div>

                  <div>
                    <h3>Email</h3>
                    <p>admin@eventexa.com</p>
                  </div>
                </div>

                <div className="admin-contact-item">
                  <div className="contact-item-icon">
                    📞
                  </div>

                  <div>
                    <h3>Phone</h3>
                    <p>+91 98765 43210</p>
                  </div>
                </div>

              </div>

              <p className="contact-admin-note">
                Please contact the administrator if you need an
                admin account or assistance with administrator access.
              </p>

              <Link
                to="/admin-login"
                className="admin-contact-login"
              >
                ← Back to Admin Login
              </Link>

              <br />

              <Link
                to="/"
                className="admin-contact-home"
              >
                Back to Home
              </Link>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactAdmin;