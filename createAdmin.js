import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcrypt.hash("admin123", 10);

  const admin = new User({
    name: "Admin",
    regNo: "ADMIN001",
    email: "admin@eventexa.com",
    password,
    role: "admin"
  });

  await admin.save();

  console.log("Admin created successfully");

  await mongoose.disconnect();
} catch (error) {
  console.error("Error creating admin:", error);
}