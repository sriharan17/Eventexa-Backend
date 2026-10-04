import { Link } from "react-router-dom";
import "./AdminForgotPassword.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";


function AdminForgotPassword() {
  const  [email,setEmail] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  
const navigate = useNavigate();

const handleSubmit =async (e)=>{
  e.preventDefault();
  setMessage("");
  setError("");
    setLoading(true);
  try{
    const response = await api.post("/auth/admin/forgot-password", {
      email: email.trim().toLowerCase(),
    });
    setMessage(response.data.message);
  }catch(err){
    setError(err.response?.data?.message || "Failed to send reset link");
  }finally{
    setLoading(false);
  }
}
  
  return (
    <div className="admin-forgot-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">

            <div className="admin-forgot-card">

              <div className="admin-forgot-icon">
                🔐
              </div>

              <h1>Forgot Password?</h1>

              <p className="admin-forgot-subtitle">
                Enter your administrator email to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="admin-email">
                    Admin Email Address
                  </label>

                  <input
                    id="admin-email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your admin email"
                    onChange={(e)=>setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="admin-reset-btn"
                  disabled ={loading}
                >
                  {loading? "Sending...":"Send Reset Link"}
                </button>
              </form>
                    {
                      message && (
                        <p style={{color:"green"}}>
                          {message}
                        </p>
                      )
                    }
                    {
                      error && (
                        <p style={{color:"red"}}>
                          {error}
                        </p>
                      )
                    }
              <Link
                to="/admin-login"
                className="admin-back-login"
                onClick={()=>navigate("/admin-login")}
              >
                ← Back to Admin Login
              </Link>

              <br />

              <Link
                to="/"
                className="admin-back-home"
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

export default AdminForgotPassword;