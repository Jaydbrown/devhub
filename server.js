const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const cors = require("cors");

app.use(
  cors({
    origin: "https://devhu.netlify.app", //  Your Netlify frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// PostgreSQL DB Connection
const { pool } = require("./config/db");

// Test DB connection
pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL Database"))
    .catch((err) => console.error(" DB Connection Error:", err.message));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/developers", require("./routes/developerRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/negotiations", require("./routes/negotiationRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
