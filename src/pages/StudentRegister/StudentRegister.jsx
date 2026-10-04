import { Link,useNavigate} from "react-router-dom";
import "./StudentRegister.css";
import api from "../../services/api";


function StudentRegister() {
  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      regNo: formData.get("regNo"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await api.post("/auth/register/student", data);
      alert(response.data.message);
      navigate("/student-login");
      // Handle successful registration (e.g., redirect to login page)
    } catch (error) {
      console.error(error.response?.data?.message || "Error registering student");
      // Handle registration error (e.g., display error message)
    }
  };

  return (
    <div className="student-register-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">

            <div className="student-register-card">

              <div className="register-icon">
                🎓
              </div>

              <h1>Create Account</h1>

              <p className="register-subtitle">
                Create your Eventexa student account.
              </p>

              <form onSubmit={handleRegister}>

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="regNo">Student ID</label>
                  <input
                    name="regNo"
                    type="text"
                    className="form-control"
                    placeholder="Enter your student ID"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">College Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your college email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Create a password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>

                  <input
                    name="confirmPassword"
                    type="password"
                    className="form-control"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  className="register-btn"
                >
                  Create Account
                </button>

              </form>

              <p className="register-footer">
                Already have an account?{" "}
                <Link to="/student-login">
                  Login
                </Link>
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

export default StudentRegister;