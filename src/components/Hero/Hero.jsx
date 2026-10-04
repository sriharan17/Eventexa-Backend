import "./Hero.css";
import heroImage from "../../assets/images/Events-amico.png";
import heroImage1 from "../../assets/images/Aboutus.png";
import { Link } from "react-router-dom";
function Hero() {
  return (
    <>
      {/* ================= HERO ================= */}

      <section className="hero" id="home">
        <div className="container hero-content">

          <div className="hero-left">

            <span className="hero-badge">
              ✨ Campus Event Management Platform
            </span>

            <h1>
              PLAN EVENTS <br />
              THAT <span>INSPIRE.</span>
            </h1>

            <p>
              Discover, register and manage campus events effortlessly.
              Eventexa helps students participate in events while enabling
              organizers to manage registrations, attendance and event details
              from one centralized platform.
            </p>
            <div className="hero-buttons">
              <Link to="/student-login" className="btn1">
                Explore Events
              </Link>
          </div>

          </div>

          <div className="hero-right">
            <img src={heroImage} alt="Eventexa Campus Events" />
          </div>

        </div>
      </section>


      {/* ================= FEATURES ================= */}

      <section className="features" id="events">
        <div className="container">

          <div className="feature-card">
            <div className="icon">🎉</div>

            <h3>Event Management</h3>

            <p>
              Create, edit and manage campus events efficiently.
            </p>
          </div>


          <div className="feature-card">
            <div className="icon">📝</div>

            <h3>Online Registration</h3>

            <p>
              Students can register for events quickly and easily.
            </p>
          </div>


          <div className="feature-card">
            <div className="icon">📢</div>

            <h3>Announcements</h3>

            <p>
              Keep students updated with important events.
            </p>
          </div>

        </div>
      </section>


      {/* ================= ABOUT US ================= */}

      <section className="about" id="about">
        <div className="container about-content">

          <div className="about-left">
            <img
              src={heroImage1}
              alt="About Eventexa"
            />
          </div>


          <div className="about-right">

            <span className="section-tag">
              About Eventexa
            </span>

            <h2>
              One Platform for Every Campus Event
            </h2>

            <p>
              Eventexa is a centralized campus event management platform
              that helps students discover and register for events while
              allowing organizers to create, manage and monitor events
              efficiently through one secure system.
            </p>


            <div className="about-list">

              <div>✔ Event Creation & Management</div>

              <div>✔ Online Registration</div>

              <div>✔ Centralized Platform</div>

              <div>✔ Secure Student Authentication</div>

            </div>

          </div>

        </div>
      </section>


      {/* ================= CONTACT ================= */}

      <section className="contact" id="contact">
        <div className="container">

          <span className="section-tag">
            Contact Us
          </span>

          <h2>
            Let's Connect
          </h2>

          <p className="contact-text">
            Have questions about Eventexa? Reach out to our team and
            we'll be happy to help you with event management and
            platform support.
          </p>


          <div className="contact-details">

            <div className="contact-card">

              <div className="contact-icon">
                📧
              </div>

              <div>
                <h3>Email</h3>
                <p>support@eventexa.com</p>
              </div>

            </div>


            <div className="contact-card">

              <div className="contact-icon">
                📞
              </div>

              <div>
                <h3>Phone</h3>
                <p>+91 98765 43210</p>
              </div>

            </div>


            <div className="contact-card">

              <div className="contact-icon">
                🕐
              </div>

              <div>
                <h3>Support Hours</h3>
                <p>Monday – Friday, 9:00 AM – 5:00 PM</p>
              </div>

            </div>

          </div>

        </div>
      </section>
    </>
  );
}

export default Hero;