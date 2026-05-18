require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const app = express();
const morgan = require("morgan");
const rateLimiter = require("express-rate-limit");
const config = require("./configuration/app.config").config;
const HTTPSTATUS = require("./configuration/http.config").HTTPSTATUS;


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
    origin: "*", // change to specific origin in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.get(`/`, (req, res) => {
  res.status(HTTPSTATUS.OK).json({
    message: "Piss Off, You Cunt.",
    status: "ok",
    timestamp: new Date().toISOString(),
    path: "/",
    success: true,
    errors: []
  });
});


app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
//   await connectDatabase();
});
