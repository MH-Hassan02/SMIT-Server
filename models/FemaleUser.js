// models/FemaleUser.js
const mongoose = require("mongoose");

const FemaleUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  cnicNumber: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  coursePreference: {
    type: String,
    required: true,
  },
  campusPreference: {
    type: String,
    required: true,
  },
  classPreference: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  hasLaptop: {
    type: String,
    required: true,
  },
  cnicPhotoUrl: {
    type: String,
  },
  profilePhotoUrl: {
    type: String,
  },
  isPass: {
    type: String,
    enum: ["Pending", "Pass", "Fail"],
    default: "Pending",
  },
  userNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  qrCodeUrl: {
    type: String,
  },
  classAlotted: {
    type: String,
    default: "",
  },
  // resetPasswordToken: {
  //   type: String,
  // },
  // resetPasswordExpires: {
  //   type: Date,
  // },
});

module.exports = mongoose.model("FemaleUser", FemaleUserSchema);
