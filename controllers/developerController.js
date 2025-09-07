const { pool } = require("../config/db");

// Get all developers
exports.getAllDevelopers = async (req, res) => {
    try {
        const developers = await pool.query(
            "SELECT id, full_name, email, expertise, hourly_rate, rating FROM users WHERE role = 'developer'"
        );
        res.json(developers.rows);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get developer by ID
exports.getDeveloperById = async (req, res) => {
    try {
        const { id } = req.params;
        const developer = await pool.query(
            "SELECT id, full_name, email, expertise, hourly_rate, rating, bio FROM users WHERE id = $1 AND role = 'developer'",
            [id]
        );

        if (developer.rows.length === 0) {
            return res.status(404).json({ message: "Developer not found" });
        }

        res.json(developer.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Search developers by expertise
exports.searchDevelopers = async (req, res) => {
    try {
        const { q } = req.query;
        const developers = await pool.query(
            "SELECT id, full_name, email, expertise, hourly_rate, rating FROM users WHERE role = 'developer' AND expertise ILIKE $1",
            [`%${q}%`]
        );
        res.json(developers.rows);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
