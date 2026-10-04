const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/eventRoutes");
const registerationRoutes = require("./routes/registerationRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events", registrationRoutes);
app.use("/api/registrations", registerationRoutes);
app.use("/api/registerations", registerationRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/registerations", registrationRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});