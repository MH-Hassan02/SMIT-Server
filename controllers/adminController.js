const Admin = require("../models/admin.model.js");
const Venue = require("../models/Venue.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (request, response) => {
  const { name, email } = request.body;
  const otpPassword = Math.floor(100000 + Math.random() * 900000).toString();

  const newAdmin = new Admin({
    name,
    email,
    otpPassword,
  });

  try {
    await newAdmin.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });

    const mailOptions = {
      from: process.env.user,
      to: email,
      subject: "Your OTP for Admin Registration",
      html: `
         <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
           <h2 style="color: #333;">Welcome to Our Platform!</h2>
           <p style="color: #555;">Dear ${name},</p>
           <p style="color: #555;">Thank you for registering. Use the following OTP to complete your registration process:</p>
           <h3 style="color: #333; background-color: #f9f9f9; padding: 10px; display: inline-block; border-radius: 5px;">${otpPassword}</h3>
           <p style="color: #555;">If you did not request this, please ignore this email.</p>
           <p style="color: #555;">Best regards,<br/>SMIT Admin</p>
         </div>
       `,
    };

    await transporter.sendMail(mailOptions);

    response
      .status(201)
      .json({ message: "Admin registered successfully, OTP sent to email." });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

exports.loginAdmin = async (request, response) => {
  const { otpPassword } = request.body;

  try {
    const admin = await Admin.findOne({ otpPassword });

    if (!admin) {
      return response.status(401).json({ message: "Invalid OTP." });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );

    response.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    }).status(200).json({
      message: "Login successful.",
      token,
      adminId: admin._id,
    });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

exports.logoutAdmin = async (request, response) => {
  try {
    response.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });
    response.status(200).json({
      message: 'Logout successful',
      status: true,
    });
  } catch (error) {
    console.log('error', error);
    response.status(500).json({
      message: 'Server error, please try again later.',
    });
  }
};

// New functions to handle venue operations

exports.addVenue = async (request, response) => {
  const { name } = request.body;

  try {
    const newVenue = new Venue({ name });
    await newVenue.save();
    response.status(201).json({ message: "Venue added successfully!" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Failed to add venue. Please try again." });
  }
};

exports.getVenues = async (request, response) => {
  try {
    const venues = await Venue.find({});
    response.status(200).json(venues);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Failed to retrieve venues. Please try again." });
  }
};