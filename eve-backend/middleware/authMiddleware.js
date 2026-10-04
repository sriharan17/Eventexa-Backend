const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "eventexa123"
    );

    req.user = decoded;

    next();

  } catch  {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


// Only admin can continue
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};


// Only student can continue
const studentOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  if (req.user.role !== "student") {
    return res.status(403).json({
      message: "Student access required"
    });
  }

  next();
};


module.exports = {
  authenticate,
  adminOnly,
  studentOnly
};