import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import api from "../../services/api";


function AdminLogin() {
  const navigate = useNavigate();

const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

   
  setError("");
  setLoading(true);

  try {
    const response = await api.post("/auth/admin/login", { email, password });

    console.log("ADMIN RESPONSE:", response.data);

    if (response.data.success) {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("student");
      localStorage.setItem(
        "adminToken",
        response.data.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(response.data.admin)
      );

      navigate("/admin-dashboard");
    } else {
      setError(response.data.message || "Login failed");
    }

  } catch (err) {
    console.error("ADMIN ERROR:", err);
    console.error("SERVER:", err.response?.data);

    setError(
      err.response?.data?.message ||
      "Login failed. Please try again."
    );
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="admin-login-page">

      <div className="container">

        <div className="row justify-content-center">

          <div className="col-12 col-sm-10 col-md-7 col-lg-5">

            <div className="admin-login-card">

              <div className="admin-login-icon">
                👨‍💼
              </div>

              <h1>Admin Login</h1>

              <p className="admin-login-subtitle">
                Login to manage campus events and registrations.
              </p>

              <form onSubmit={handleLogin}>

                <div className="form-group">

                  <label>Email Address</label>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                </div>


                <div className="form-group">

                  <label>Password</label>

                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                </div>


                <div className="forgot-admin">

                  <Link to="/admin-forgot-password">
                    Forgot Password?
                  </Link>

                </div>


                {error && (
                  <p
                    style={{
                      color: "#ff6b6b",
                      marginBottom: "15px"
                    }}
                  >
                    {error}
                  </p>
                )}


                <button 
                  type="submit"
                  className="admin-login-btn"
                  disabled={loading}
                >
                  {loading ?"Logging in...":"Login"}
                </button>

              </form>


              <p className="admin-login-footer">
                Need help?{" "}
                <Link to="/contact-admin">
                  Contact Admin
                </Link>
              </p>


              <Link
                to="/"
                className="admin-back-home"
              >
                ← Back to Home
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminLogin;