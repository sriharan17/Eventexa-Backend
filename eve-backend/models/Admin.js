const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    name:{
        type: String,
        require: true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
    password:{
        type:String,
        require:true
    },
    resetPasswordToken:{
        type:String,
        default: null
    },
    resetPasswordExpires:{
        type: Date,
        deafult: null
    }

})

module.exports = mongoose.model("Admin",adminSchema)