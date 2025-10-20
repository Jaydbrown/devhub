// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import developerRoutes from "./routes/developerRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import statsRoutes from "./routes/statRoutes.js"; // note the singular "statRoutes"
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// ✅ CORS Configuration
// =====================
const allowedOrigins = [
  "https://devhyb-frontend.vercel.app", // your deployed frontend
  "http://localhost:3000",              // local dev frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("*", cors()); // preflight requests

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =====================
// Routes
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

// =====================
// Health Check
// =====================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// =====================
// 404 Handler
// =====================
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// =====================
// Error Handler
// =====================
app.use(errorHandler);

// =====================
// Start Server
// =====================
app.listen(PORT, () => {
  console.log(`🚀 DevHub API running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Allowed Frontend: https://devhyb-frontend.vercel.app`);
});
