require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimiter = require("express-rate-limit");
const mongoose = require("mongoose"); // Added for MongoDB
const diagnosisRoutes = require("./routes/diagnosisRoutes"); // Import diagnosis routes


const config = require("./configuration/app.config").config;
const HTTPSTATUS = require("./configuration/http.config").HTTPSTATUS;

// 1. Import our Authentication Routes
const authRoutes = require("./routes/authRoutes");

const app = express();

// app.use(cors({
//     origin: 'http://localhost:5173', // Change this if your Vite app runs on a different port
//     credentials: true,               // This allows your frontend to send tokens/cookies
// }));

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  }),
);
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173", // Keep as "*" for dev, change to your frontend URL in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

// Health Check Route
app.get(`/`, (req, res) => {



  res.status(HTTPSTATUS.OK).json({
    message: "Piss Off, You Anirudh.", 
    status: "ok",
    timestamp: new Date().toISOString(),
    path: "/",
    success: true,
    errors: []
  });
});

// 2. Mount Authentication Routes
app.use("/api/auth", authRoutes);
app.use("/api/diagnosis", diagnosisRoutes);

// 3. Database Connection Function
const connectDatabase = async () => {
  try {
    // Assuming process.env.MONGO_URI is set in your .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Stop the server if the database fails to connect
  }
};

// Start Server
app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase(); // Uncommented and active!
});