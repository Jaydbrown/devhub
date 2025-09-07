const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const { pool } = require("./config/db");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
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

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", database: "connected", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: err.message,
    });
  }
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/developers", require("./routes/developerRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/negotiations", require("./routes/negotiationRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
