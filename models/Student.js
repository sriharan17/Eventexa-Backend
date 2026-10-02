const mongoose = require("mongoose");


const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    regNo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "student"
    }
});

module.exports = mongoose.model("Student", studentSchema);