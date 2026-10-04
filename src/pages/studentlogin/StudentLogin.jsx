import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StudentLogin.css";
import api from "../../services/api";

function StudentLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login/student", {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      localStorage.setItem("student", JSON.stringify(response.data.student));
      localStorage.setItem("studentToken", response.data.token);
      navigate("/student-dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          (error.request
            ? "Unable to connect to the backend. Make sure it is running on port 5000."
            : "Unable to complete login.")
      );
    }
  };

  return (
    <div className="student-login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">

            <div className="student-login-card">

              <div className="login-icon">🎓</div>

              <h1>Student Login</h1>

              <p className="login-subtitle">
                Login to discover and register for campus events.
              </p>

              <form onSubmit={handleLogin}>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="forgot-password">
                  <Link to="/forgot-password">
                    Forgot Password?
                  </Link>
                </div>

                {error && (
                  <p style={{ color: "#ff6b6b", marginBottom: "15px" }}>
                    {error}
                  </p>
                )}

                <button type="submit" className="login-btn">
                  Login
                </button>

              </form>

              <p className="login-footer">
                Don't have an account?{" "}
                <Link to="/student-register">Register</Link>
              </p>

              <Link to="/" className="back-home">
                ← Back to Home
              </Link>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;