require("dotenv").config();
console.log("[INIT] Server starting...");
console.log("[INIT] Loading dependencies...");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimiter = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("node:path");

console.log("[INIT] Dependencies loaded");

const diagnosisRoutes = require("./routes/diagnosisRoutes");
const predictRoutes = require("./routes/predictRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");

console.log("[INIT] Routes imported");

const config = require("./configuration/app.config").config;
const HTTPSTATUS = require("./configuration/http.config").HTTPSTATUS;

console.log("[INIT] Config loaded. PORT:", config.PORT, "NODE_ENV:", config.NODE_ENV);
console.log("[INIT] Env check - MONGO_URI exists:", !!process.env.MONGO_URI);

const app = express();

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  }),
);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://plant-disease-detection-peach.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "x-request-source"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

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
app.use("/api/predict", predictRoutes);
app.use("/api/chat", chatRoutes);

// 3. Database Connection Function
const connectDatabase = async () => {
  try {
    console.log('[STARTUP] Env vars check:');
    console.log(`[STARTUP] MONGO_URI exists: ${!!process.env.MONGO_URI}`);
    console.log(`[STARTUP] MONGO_URI value (first 50 chars): ${process.env.MONGO_URI?.substring(0, 50)}...`);
    console.log(`[STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set!');
    }
    
    // Assuming process.env.MONGO_URI is set in your .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Stop the server if the database fails to connect
  }
};

// Start Server
const PORT = config.PORT || 5000;
console.log("[STARTUP] About to call app.listen on port", PORT);

app.listen(PORT, async () => {
  console.log(`\n[STARTUP] ✅ Express server listening on port ${PORT}`);
  console.log("[STARTUP] Now connecting to MongoDB...");
  await connectDatabase();
  console.log("[STARTUP] ✅ Database connection complete\n");
});