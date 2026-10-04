import "./Navbar.css";
import { useState } from "react";
import { Link } from "react-router-dom";
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">

        {/* Logo */}
        <div className="logo">
          <div className="logo-icon"></div>
          <h2>Eventexa</h2>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        {/* Navigation + Buttons */}
        <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>

          {/* Navigation Links */}
          <ul className="nav-links">
            <li>
              <a href="#home" onClick={closeMenu}>Home</a>
            </li>

            <li>
              <a href="#about" onClick={closeMenu}>About Us</a>
            </li>

            <li>
              <a href="#contact" onClick={closeMenu}>Contact Us</a>
            </li>
          </ul>

          {/* Right Side Buttons */}
          <div className="nav-buttons">

            <Link to="/student-login" className="student-btn">
              Student
            </Link>

            <Link to="/admin-login" className="admin-btn">
              Admin
            </Link>

            <button className="start-btn">
              Get Started
            </button>

          </div>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;