const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require("fs");
const cloudinary = require("../config/cloudinaryConfig");
const { validationResult } = require("express-validator");
const MaleUser = require("../models/MaleUser");
const FemaleUser = require("../models/FemaleUser");
const Counter = require("../models/Counter");
const path = require("path");
const nodemailer = require("nodemailer");

// Register User
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    fatherName,
    cnicNumber,
    dateOfBirth,
    gender,
    email,
    password,
    phoneNumber,
    coursePreference,
    campusPreference,
    classPreference,
    qualification,
    hasLaptop,
    rollNumber,
    qrCodeUrl,
  } = req.body;

  try {
    // Checking if user already exists in database
    let userModel = gender === "M" ? MaleUser : FemaleUser;
    let counterName = gender === "M" ? "maleUserSeq" : "femaleUserSeq";
    let existingUser =
      (await MaleUser.findOne({ email })) ||
      (await FemaleUser.findOne({ email })) ||
      (await MaleUser.findOne({ cnicNumber })) ||
      (await FemaleUser.findOne({ cnicNumber }));
    if (existingUser) {
      return res.status(400).json({
        msg: "User with this email or CNIC already exists.",
      });
    }

    // Parse date of birth if it's in 'dd.mm.yyyy' format
    let parsedDateOfBirth = dateOfBirth;
    const dobParts = dateOfBirth.split(".");
    if (dobParts.length === 3) {
      parsedDateOfBirth = new Date(
        `${dobParts[1]}/${dobParts[0]}/${dobParts[2]}`
      );
    }

    // Upload the CNIC photo to Cloudinary
    const uploadFolderPath = "Upload/";
    const filesInUploadFolder = fs.readdirSync(uploadFolderPath);
    if (!filesInUploadFolder || filesInUploadFolder.length === 0) {
      return res.status(400).json({ msg: "No files found in Upload folder" });
    }
    const filePath = `${uploadFolderPath}/${filesInUploadFolder[0]}`;
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "cnic_photos",
    });

    // Upload Profile photo to Cloudinary
    const profilePath = "Upload Profile/";
    const filesInProfileFolder = fs.readdirSync(profilePath);
    if (!filesInProfileFolder || filesInProfileFolder.length === 0) {
      return res
        .status(400)
        .json({ msg: "No files found in Upload Profile folder" });
    }
    const profileFilePath = `${profilePath}/${filesInProfileFolder[0]}`;
    const profileUploadResult = await cloudinary.uploader.upload(
      profileFilePath,
      {
        folder: "profile_photos",
      }
    );

    // Delete all the files in Upload and Upload Profile Folder
    // This is for incase there are multiple files in the folder accidentally
    const deleteFolderRecursive = (folderPath) => {
      if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
          const curPath = path.join(folderPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
      }
    };

    deleteFolderRecursive(uploadFolderPath);
    deleteFolderRecursive(profilePath);

    // Create user with the provided data
    const user = new userModel({
      name,
      fatherName,
      cnicNumber,
      dateOfBirth: parsedDateOfBirth,
      gender,
      email,
      password,
      phoneNumber,
      coursePreference,
      campusPreference,
      classPreference,
      qualification,
      hasLaptop,
      rollNumber,
      qrCodeUrl,
      cnicPhotoUrl: uploadResult.secure_url,
      profilePhotoUrl: profileUploadResult.secure_url,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Setup the email transport
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.user,
      to: email,
      subject: "Thank You for Registering for the Saylani Test",
      html: `
          <div style="font-family: 'Montserrat', sans-serif; text-align: center; padding: 20px; border: 2px solid #2683CD;">
  <h2 style="color: #267BBB; font-weight: bold;">Welcome to Our Platform!</h2>
  <p style="color: #8DC63F; font-weight: bold;">Dear ${name},</p>
  <p style="color: #8DC63F; font-weight: bold;">Thank you for registering for the Saylani test. We are excited to have you on board.</p>
  <p style="color: #8DC63F; font-weight: bold;">If you did not request this, please ignore this email.</p>
  <p style="color: #8DC63F; font-weight: bold;">Best regards,<br/>Saylani</p>
</div>


          `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Increment the counter after successful user registration
    const counter = await Counter.findOneAndUpdate(
      { sequenceName: counterName },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    // Assign the sequential number
    user.userNumber = counter.sequenceValue;
    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      config.get("jwtSecret"),
      { expiresIn: 3600 },
      (err, token) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Error signing token");
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await MaleUser.findOne({ email });
    if (!user) {
      user = await FemaleUser.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      config.get("jwtSecret"),
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get User by Token
exports.getUser = async (req, res) => {
  try {
    let user = await MaleUser.findById(req.user.id).select("-password");
    if (!user) {
      user = await FemaleUser.findById(req.user.id).select("-password");
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, rollNumber, cnicNumber, phoneNumber, isPass } = req.body;

  try {
    let user = await MaleUser.findById(id);
    if (!user) {
      user = await FemaleUser.findById(id);
    }
    if (!user) {
      return res.status(400).json({ msg: "No account with that email found." });
    }

    // Update user fields
    user.name = name;
    user.rollNumber = rollNumber;
    user.cnicNumber = cnicNumber;
    user.phoneNumber = phoneNumber;
    user.isPass = isPass;

    await user.save();
    res.status(200).json({ msg: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user", error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllUsers = async (_req, res) => {
  try {
    let maleUsers = await MaleUser.find({ gender: "M" });
    let femaleUsers = await FemaleUser.find({ gender: "F" });
    let maleCounter = await Counter.find({ sequenceName: "maleUserSeq" });
    let femaleCounter = await Counter.find({ sequenceName: "femaleUserSeq" });
    res.json({
      users: [...maleUsers, ...femaleUsers],
      maleUsers: [...maleUsers],
      femaleUsers: [...femaleUsers],
      maleCounter: [...maleCounter],
      femaleCounter: [...femaleCounter],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const sendPlacementEmails = async (users, venue, date, time) => {
  // Setup the email transport
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.user,
      pass: process.env.pass,
    },
  });

  // Send emails to users
  for (const user of users) {
    const mailOptions = {
      from: process.env.user,
      to: user.email,
      subject: `Placement Notification`,
      html: `
        <div style="font-family: 'Montserrat', sans-serif; text-align: center; padding: 20px; border: 2px solid #2683CD;">
          <h2 style="color: #267BBB; font-weight: bold;">Placement Notification</h2>
          <p style="color: #8DC63F; font-weight: bold;">Dear ${user.name},</p>
          <p style="color: #8DC63F; font-weight: bold;">You have been assigned to ${venue} for SMIT admission test.</p>
          <p style="color: #8DC63F; font-weight: bold;">Date: ${date}</p>
          <p style="color: #8DC63F; font-weight: bold;">Time: ${time}</p>
          <p style="color: #8DC63F; font-weight: bold;">Best regards,<br/>Saylani</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}`); 
    } catch (err) {
      console.error(`Failed to send email to ${user.email}: ${err.message}`);
    }
  }
};

exports.sendPlacementEmails = async (req, res) => {
  const { start, end, gender, venue, date, time } = req.body; // Extract parameters from request body

  // Validate parameters
  if (!start || !end || isNaN(start) || isNaN(end) || !gender || !venue || !date || !time) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }

  console.log('Starting email sending process...');
  try {
    let users;
    if (gender === 'M') {
      users = await MaleUser.find({
        gender: 'M',
        userNumber: { $gte: parseInt(start), $lte: parseInt(end) }
      });
    } else {
      users = await FemaleUser.find({
        gender: 'F',
        userNumber: { $gte: parseInt(start), $lte: parseInt(end) }
      });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found in the given range' });
    }

    await sendPlacementEmails(users, venue, date, time);
    res.status(200).json({ message: 'Emails successfully sent' });
  } catch (err) {
    console.error('Error sending emails:', err);
    res.status(500).json({ message: 'Failed to send emails' });
  }
};


exports.checkAuth = async (req, res) => {
  const token = req.cookies.token; // Access token from cookies

  if (!token) {
    console.log("Error No token")
    return res.status(401).json({ message: "No token provided, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY); // Verify the token
    req.user = decoded; // Attach user data to request
    res.status(200).json({ message: "Token is valid", user: decoded });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token is not valid" });
  }
};
