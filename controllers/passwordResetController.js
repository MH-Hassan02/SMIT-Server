// controllers/authController.js
const bcrypt = require('bcryptjs');
const MaleUser = require("../models/MaleUser");
const FemaleUser = require("../models/FemaleUser");

// Change Password
exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    let user = await MaleUser.findOne({ email });
    if (!user) {
      user = await FemaleUser.findOne({ email });
    }
    if (!user) {
      return res.status(400).json({ msg: "No account with that email found." });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    // Ensure new password is not the same as the old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as the old password' });
    }

    // Check new password length
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
