import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "../AdminForgotPassword/AdminForgotPassword.css";

function AdminResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post(`/auth/admin/reset-password/${token}`, {
        newPassword,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/admin-login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-forgot-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <div className="admin-forgot-card">
              <div className="admin-forgot-icon">🔐</div>
              <h1>Set New Password</h1>
              <p className="admin-forgot-subtitle">
                Choose a new password for your administrator account.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="admin-new-password">New Password</label>
                  <input
                    id="admin-new-password"
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <button type="submit" className="admin-reset-btn" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              {message && <p style={{ color: "green" }}>{message}</p>}
              {error && <p style={{ color: "red" }}>{error}</p>}

              <Link to="/admin-login" className="admin-back-login">
                Back to Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminResetPassword;
