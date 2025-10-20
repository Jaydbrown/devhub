import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// ✅ Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.user_type,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ✅ Register user
export const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      userType,
      username,
      bio,
      skills,
      experienceLevel,
      yearsExperience,
      portfolioUrl,
      location,
      hourlyRate,
      companyName,
      companyWebsite,
      industry,
      companySize,
      workEmail,
      budgetRange,
      phone,
      preferredComm,
    } = req.body;

    // Check if user already exists
    const userCheck = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      throw new AppError("User already exists with this email", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await query(
      `INSERT INTO users (full_name, email, password, user_type, phone, preferred_comm, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING id, full_name, email, user_type`,
      [fullName, email, hashedPassword, userType, phone || null, preferredComm || "Email"]
    );

    const userId = userResult.rows[0].id;

    // Insert developer-specific data
    if (userType === "Developer") {
      await query(
        `INSERT INTO developers (user_id, username, bio, skills, experience_level, years_experience, portfolio_url, location, hourly_rate, rating, total_reviews) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0)`,
        [
          userId,
          username || fullName,
          bio || "",
          skills || "",
          experienceLevel || "Mid",
          yearsExperience || 0,
          portfolioUrl || "",
          location || "",
          hourlyRate || 0,
        ]
      );
    }

    // Insert client-specific data
    if (userType === "Client") {
      await query(
        `INSERT INTO clients (user_id, company_name, company_website, industry, company_size, work_email, budget_range, location) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          companyName || "",
          companyWebsite || "",
          industry || "",
          companySize || "",
          workEmail || email,
          budgetRange || "",
          location || "",
        ]
      );
    }

    // Generate token
    const token = generateToken(userResult.rows[0]);

    res.status(201).json({
      message: "User registered successfully",
      user: userResult.rows[0],
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      throw new AppError("Invalid email or password", 401);
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        userType: user.user_type,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      "SELECT id, full_name, email, user_type, phone, preferred_comm FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    next(error);
  }
};
