const { pool } = require("../config/db");

// Start negotiation
exports.startNegotiation = async (req, res) => {
    try {
        const { job_id, client_id, developer_id, proposed_budget } = req.body;

        const negotiation = await pool.query(
            "INSERT INTO negotiations (job_id, client_id, developer_id, proposed_budget, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
            [job_id, client_id, developer_id, proposed_budget]
        );

        res.status(201).json({ message: "Negotiation started", negotiation: negotiation.rows[0] });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Update negotiation status
exports.updateNegotiationStatus = async (req, res) => {
    try {
        const { negotiation_id, status } = req.body;

        await pool.query("UPDATE negotiations SET status = $1 WHERE id = $2", [status, negotiation_id]);

        res.json({ message: "Negotiation status updated" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
