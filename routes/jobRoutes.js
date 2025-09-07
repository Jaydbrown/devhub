const express = require("express");
const router = express.Router();
const {
    createJob,
    getAllJobs,
    applyForJob,
    assignDeveloper,
} = require("../controllers/jobController");

// Create job
router.post("/", createJob);

// Get all jobs
router.get("/", getAllJobs);

// Apply for a job
router.post("/:jobId/apply", applyForJob);

// Assign developer to job
router.post("/:jobId/assign", assignDeveloper);

module.exports = router;
