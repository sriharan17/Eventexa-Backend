import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ForgotPassword.css";


function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/forgot-password/student", {
        email: email.trim().toLowerCase(),
        newPassword,
      });

      alert(res.data.message);
      navigate("/student-login");
    } catch (err) {
      console.log("RESET ERROR:",err);
      console.log("STATUS:",err.response?.status);
      console.log("DATA:",err.response?.data);
      alert(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <div className="forgot-password-card">
              <div className="forgot-icon">🔐</div>

              <h1>Forgot Password?</h1>

              <p className="forgot-subtitle">
                Enter your registered email and set a new password to continue.
              </p>

              <form onSubmit={handleReset}>
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reset-password">New Password</label>
                  <input
                    id="reset-password"
                    type="password"
                    className="form-control"
                    placeholder="Enter a new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="reset-btn">
                  Reset Password
                </button>
              </form>

              <Link to="/student-login" className="back-login">
                ← Back to Login
              </Link>

              <br />

              <Link to="/" className="back-home">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;