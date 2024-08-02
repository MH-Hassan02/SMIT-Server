const express = require("express");
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const { changePassword } = require("../controllers/passwordResetController");
const { allocateClasses } = require("../controllers/allocationController");

const router = express.Router();

// User registration and login routes
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("fatherName", "Father Name is required").not().isEmpty(),
    check("cnicNumber", "CNIC Number is required").not().isEmpty(),
    check("dateOfBirth", "Date of Birth is required").not().isEmpty(),
    check("gender", "Gender is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Password is required with 8 or more characters"
    ).isLength({ min: 8 }),
    check("phoneNumber", "Phone Number is required").not().isEmpty(),
    check("coursePreference", "coursePreference is required").not().isEmpty(),
    check("campusPreference", "campusPreference is required").not().isEmpty(),
    check("classPreference", "classPreference is required").not().isEmpty(),
    check("qualification", "qualification is required").not().isEmpty(),
    check("hasLaptop", "hasLaptop is required").not().isEmpty(),
  ],
  authController.registerUser
);

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  authController.loginUser
);

// For User to get in Dashboard
router.get("/user", auth, authController.getUser);

// For admin to get all Users
router.get("/allUsers", authController.getAllUsers);

// Venue management routes
router.post('/venue/add', adminController.addVenue);
router.get('/venue/get', adminController.getVenues);

// Send placement emails route
router.post('/sendPlacementEmails', authController.sendPlacementEmails);

// For user to update password
router.post('/change-password', changePassword);

// For admin to update User
router.put('/updateUser/:id', authController.updateUser);

// Admin routes
router.post("/admin/register", adminController.registerAdmin);
router.post("/admin/login", adminController.loginAdmin);
router.post("/admin/logout", adminController.logoutAdmin);

router.get('/admin/check-auth', authController.checkAuth);


// Allocation Route
router.post('/admin/allocate', allocateClasses);

module.exports = router;
