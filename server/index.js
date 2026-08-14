require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimiter = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("node:path");

const diagnosisRoutes = require("./routes/diagnosisRoutes");
const predictRoutes = require("./routes/predictRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const config = require("./configuration/app.config").config;
const HTTPSTATUS = require("./configuration/http.config").HTTPSTATUS;

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
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow any local network origin (localhost, 127.0.0.1, 192.168.x.x, etc.)
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", process.env.CLIENT_URL].filter(Boolean);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
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

app.get("/", (req, res) => {
  res.status(HTTPSTATUS.OK).json({
    message: "Plant Disease Detection API is running",
    status: "ok",
    timestamp: new Date().toISOString(),
    path: "/",
    success: true,
    errors: [],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/chat", chatRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large. Maximum upload size is 5MB." });
  }

  if (error?.message === "Only image files are allowed") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ success: false, message: "Invalid JSON request body" });
  }

  console.error("[ERROR]", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

const connectDatabase = async () => {
  console.log("[STARTUP] MONGO_URI exists:", Boolean(process.env.MONGO_URI));
  console.log("[STARTUP] NODE_ENV:", process.env.NODE_ENV || "development");

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("[STARTUP] Connected to MongoDB");
};

const PORT = config.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`[STARTUP] Express server listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("[STARTUP] Server startup failed:", error.message);
  process.exit(1);
});
