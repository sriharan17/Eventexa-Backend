import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import StudentLogin from "./pages/studentlogin/StudentLogin";
import StudentRegister from "./pages/StudentRegister/StudentRegister";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

import AdminLogin from "./pages/adminlogin/AdminLogin";
import AdminForgotPassword from "./pages/AdminForgotPassword/AdminForgotPassword";
import AdminResetPassword from "./pages/AdminResetPassword/AdminResetPassword";
import ContactAdmin from "./pages/ContactAdmin/ContactAdmin";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AddEvent from "./pages/AddEvent/AddEvent";
import ManageEvents from "./pages/ManageEvents/ManageEvents";

import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import AllEvents from "./pages/AllEvents/AllEvents";
import MyRegistrations from "./pages/MyRegistrations/MyRegistrations";
import RegisteredStudents from "./pages/RegisteredStudents/RegisteredStudents";
import EventCertificates from "./pages/EventCertificates/EventCertificates";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Student */}
        <Route
          path="/student-login"
          element={<StudentLogin />}
        />

        <Route
          path="/student-register"
          element={<StudentRegister />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/student-dashboard"
          element={<StudentDashboard />}
        />

        {/* Admin */}
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin-forgot-password"
          element={<AdminForgotPassword />}
        />

        <Route
          path="/admin-reset-password/:token"
          element={<AdminResetPassword />}
        />

        <Route
          path="/contact-admin"
          element={<ContactAdmin />}
        />

        <Route
          path="/all-events"
          element={<AllEvents />}
        />

        <Route
          path="/my-registrations"
          element={<MyRegistrations />}
        />

        <Route
          path="/event-e-certificates"
          element={<EventCertificates />}
        />
        <Route
          path="/event-e-certificates/:registrationId"
          element={<EventCertificates />}
        />
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/add-event"
          element={<AddEvent />}
        />

        <Route
          path="/manage-events"
          element={<ManageEvents />}
        />
        <Route path='/registered-students'
        element ={<RegisteredStudents/>}/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;