const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

// ======================= REGISTER =======================
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // 1. Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Check if user already exists
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insert user into DB
        const newUser = await pool.query(
            `INSERT INTO users (name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email, role`,
            [fullName, email, hashedPassword, role || "client"]
        );

        // 5. Generate JWT token
        const token = jwt.sign(
            { id: newUser.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: newUser.rows[0]
        });
    } catch (err) {
        console.error("❌ Registration error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ======================= LOGIN =======================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // 2. Find user by email
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 3. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 4. Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
