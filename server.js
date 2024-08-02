const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ['https://admin-smit.vercel.app', 'https://students-smit.vercel.app', 'http://localhost:5173'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true,
  })
);

// Configure Multer for handling file uploads
const upload = multer({ dest: "Upload/" });
const uploadProfile = multer({ dest: "Upload Profile" });

// Endpoint to handle file uploads and text detection
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath);
    const text = await detectText(fileContent);
    res.json({ text });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.post("/uploadProfile", uploadProfile.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath);
    // Handle profile upload logic here if needed
    res.status(200).json({ message: "Profile image uploaded successfully." });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Function to detect text using Google Cloud Vision API
async function detectText(imageContent) {
  try {
    const response = await axios.post(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        requests: [
          {
            image: {
              content: imageContent.toString("base64"),
            },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      },
      {
        params: {
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const fullText = response.data.responses[0].fullTextAnnotation.text;
    console.log("Extracted Text:", fullText);
    return fullText;
  } catch (error) {
    console.error("Error detecting text:", error);
    throw error;
  }
}

// Define Routes for authentication and admin
app.use("/", require("./routes/auth"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
