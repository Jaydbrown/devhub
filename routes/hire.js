const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// POST /api/hire -> Send hire request
router.post("/", async (req, res) => {
    try {
        const { developer_id, client_id } = req.body;

        const result = await pool.query(
            "INSERT INTO hire_requests (developer_id, client_id, status) VALUES ($1, $2, 'pending') RETURNING *",
            [developer_id, client_id]
        );

        res.json({ message: "Hire request sent successfully", hire: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
