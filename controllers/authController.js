const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        
        // Check if user already exists
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user - updated column names to match your schema
        const newUser = await pool.query(
            "INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING *",
            [fullName, email, hashedPassword]
        );
        
        res.status(201).json({ message: "Registration successful", user: newUser.rows[0] });
    } catch (err) {
        console.log("Registration error:", err); // Added logging
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user - updated column name
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = userResult.rows[0];
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Compare password - updated column name
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        
        // Create JWT token - removed role since it doesn't exist in schema
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        
        res.json({ message: "Login successful", token, user });
    } catch (err) {
        console.log("Login error:", err); // Added logging
        res.status(500).json({ message: "Server error", error: err.message });
    }
};