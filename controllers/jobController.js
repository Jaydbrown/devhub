const { pool } = require("../config/db");

// ✅ Create a new job
exports.createJob = async (req, res) => {
    try {
        const { title, description, budget, client_id } = req.body;

        if (!title || !description || !budget || !client_id) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newJob = await pool.query(
            `INSERT INTO jobs (title, description, budget, client_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [title, description, budget, client_id]
        );

        res.status(201).json({
            message: "Job created successfully",
            job: newJob.rows[0],
        });
    } catch (err) {
        console.error("❌ Create Job Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ✅ Get all jobs with client & developer names
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await pool.query(
            `SELECT jobs.*, 
                    u.name AS client_name,
                    d.name AS developer_name
             FROM jobs
             JOIN users u ON jobs.client_id = u.id
             LEFT JOIN developers dev ON jobs.developer_id = dev.id
             LEFT JOIN users d ON dev.user_id = d.id
             ORDER BY jobs.created_at DESC`
        );        
        res.json(jobs.rows);
    } catch (err) {
        console.error("❌ Fetch Jobs Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ✅ Apply for a job
exports.applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { developer_id } = req.body;

        if (!developer_id) {
            return res.status(400).json({ message: "Developer ID is required" });
        }

        await pool.query(
            `INSERT INTO job_applications (job_id, developer_id)
             VALUES ($1, $2)
             ON CONFLICT (job_id, developer_id) DO NOTHING`,
            [jobId, developer_id]
        );

        res.json({ message: "Application submitted successfully" });
    } catch (err) {
        console.error("❌ Apply Job Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ✅ Assign developer to a job
exports.assignDeveloper = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { developer_id } = req.body;

        if (!developer_id) {
            return res.status(400).json({ message: "Developer ID is required" });
        }

        await pool.query(
            `UPDATE jobs 
             SET developer_id = $1, status = 'assigned'
             WHERE id = $2`,
            [developer_id, jobId]
        );

        res.json({ message: "Developer assigned successfully" });
    } catch (err) {
        console.error(" Assign Developer Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
