const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin")
const crypto = require("crypto")
const { sendMail, sendStudentWelcomeEmail } = require("../utils/mailer");

// Student registration route


router.post("/register/student", async (req, res) => {
  try {
    const {
      name,
      regNo,
      email,
      password
    } = req.body;

    // Check required fields
    if (!name || !regNo || !email || !password) {
      return res.status(400).json({
        message: "Name, registration number, email and password are required"
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // Check if registration number already exists
    const existingRegNo = await User.findOne({
      regNo: regNo.trim()
    });

    if (existingRegNo) {
      return res.status(400).json({
        message: "Registration number already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = new User({
      name: name.trim(),
      regNo: regNo.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "student"
    });

    await student.save();

    try {
      await sendStudentWelcomeEmail(student);
    } catch (emailError) {
      console.error("Student welcome email failed:", emailError.message);
    }

    res.status(201).json({
      message: "Student registered successfully",
      student: {
        id: student._id,
        name: student.name,
        regNo: student.regNo,
        email: student.email,
        role: student.role
      }
    });

  } catch (error) {
    console.error("Student registration error:", error);

    res.status(500).json({
      message: "Student registration failed",
      error: error.message
    });
  }
});

// Student Login

router.post("/login/student", async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await User.findOne({
      email: email?.trim().toLowerCase(),
      role: "student"
    });
    if (!student)
      return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, student.password);
    if (!ok)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: student._id, role: "student" },
      process.env.JWT_SECRET || "eventexa123",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        regNo: student.regNo,
        email: student.email,
        role: student.role
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Student Reset Password
router.post("/forgot-password/student", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Check required fields
    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and new password are required"
      });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // Find student
    const student = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "student"
    });

    if (!student) {
      return res.status(404).json({
        message: "Student email not registered"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    student.password = hashedPassword;

    await student.save();

    return res.status(200).json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Password reset failed",
      error: error.message
    });
  }
});

// ==========================
// ADMIN REGISTER
// POST /api/auth/admin/register
// ==========================
router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existing = await Admin.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      email,
      password: hashedPassword
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ==========================
// ADMIN LOGIN
// POST /api/auth/admin/login
// ==========================
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }
    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin"
      },
      process.env.JWT_SECRET || "eventexa123",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// forget- password//
router.post("/admin/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
       
        message: "Admin email not found"
      });
    }



    const token = crypto.randomBytes(32).toString("hex");

    admin.resetPasswordToken = token;
    admin.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await admin.save();

    const resetLink =
      `${process.env.FRONTEND_URL}/admin-reset-password/${token}`;

    await sendMail({
      to: admin.email,
      subject: "Eventexa Admin Password Reset",
      html: `
        <h2>Reset Your Admin Password</h2>
        <p>Click the button below to reset your password.</p>

        <a href="${resetLink}" style="display:inline-block;
        padding:12px 20px;
        background:#ff4fc3;
        color:white;
        text-decoration:none;
        border-radius:6px;">
          Reset Password
        </a>

        <p>This link expires in 15 minutes.</p>
      `
    });

    res.json({
      success: true,
      message: "Reset link sent to your email"
    });

  } catch (error) {
    console.error("Forgot Password",error);

    res.status(500).json({
      success: false,
      message: "Failed to send reset email"
    });
  }
});

router.post("/admin/reset-password/:token", async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const admin = await Admin.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!admin) {
      return res.status(400).json({
        message: "Reset link is invalid or expired"
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetPasswordToken = null;
    admin.resetPasswordExpires = null;
    await admin.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Admin reset password error", error);
    return res.status(500).json({ message: "Password reset failed" });
  }
});


module.exports = router;