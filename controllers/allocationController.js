const MaleUser = require("../models/MaleUser");
const FemaleUser = require("../models/FemaleUser");

exports.allocateClasses = async (req, res) => {
  const { coursePreference, gender, classPreference, campusPreference, numStudents } = req.body;

  try {
    const User = gender === 'male' ? MaleUser : FemaleUser;

    // Fetch users based on the provided criteria
    const users = await User.find({
      isPass: "Pass",
      coursePreference: coursePreference,
      campusPreference: campusPreference,
      classPreference: classPreference
    }).limit(parseInt(numStudents)).exec();
    
    // Update users to assign the class
    const classAlotted = `${coursePreference} / ${classPreference} / ${campusPreference}`;
    const updatedUsers = await Promise.all(users.map(async (user) => {
      user.classAlotted = classAlotted;
      await user.save();
      return user;
    }));

    res.status(200).json(updatedUsers);
  } catch (error) {
    console.error('Error allocating classes:', error);
    res.status(500).json({ error: 'Error allocating classes' });
  }
};
