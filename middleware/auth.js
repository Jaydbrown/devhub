import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// ✅ Verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user; // Attach user info to request
    next();
  });
};

// ✅ Check if user is a developer
export const isDeveloper = (req, res, next) => {
  if (req.user.userType !== "Developer") {
    return res
      .status(403)
      .json({ error: "Access denied. Developer account required." });
  }
  next();
};

// ✅ Check if user is a client
export const isClient = (req, res, next) => {
  if (req.user.userType !== "Client") {
    return res
      .status(403)
      .json({ error: "Access denied. Client account required." });
  }
  next();
};

// ✅ Optional authentication (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};
