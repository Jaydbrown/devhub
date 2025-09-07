const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

//  Get logged-in user's profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from auth middleware

        const result = await pool.query(
            `SELECT id, name, email, role, bio, skills
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(" Get Profile Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


//  Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.body.user_id; // get user id
        const { name, bio, skills } = req.body;

        //  Fetch the current user first
        const existingUser = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [userId]
        );

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        //  Fallback to existing values if fields are missing
        const updatedName = name && name.trim() !== "" ? name : existingUser.rows[0].name;
        const updatedBio = bio !== undefined ? bio : existingUser.rows[0].bio;
        const updatedSkills = skills
            ? Array.isArray(skills)
                ? skills
                : skills.split(",").map((s) => s.trim())
            : existingUser.rows[0].skills;

        const result = await pool.query(
            `UPDATE users
             SET name = $1, bio = $2, skills = $3
             WHERE id = $4
             RETURNING id, name, email, role, bio, skills`,
            [updatedName, updatedBio, updatedSkills, userId]
        );

        res.status(200).json({
            message: "Profile updated successfully",
            profile: result.rows[0]
        });
    } catch (err) {
        console.error("  Profile Update Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


// Change password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { old_password, new_password } = req.body;

        const userResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(old_password, userResult.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashedPassword, userId]);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(" Change Password Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
