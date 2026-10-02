const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,required: true
    },
    regNo: {
        type: String,
        required: true,
        trim: true,
        sparse: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,required: true
    },
    role: {
        type: String,
        enum:["admin","student"],
        default:"student",

    }

});

module.exports = mongoose.model("User", userSchema);