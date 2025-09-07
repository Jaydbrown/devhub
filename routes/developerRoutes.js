const express = require("express");
const router = express.Router();
const {
    getAllDevelopers,
    getDeveloperById,
    searchDevelopers,
} = require("../controllers/developerController");

router.get("/", getAllDevelopers);
router.get("/search", searchDevelopers);
router.get("/:id", getDeveloperById);
// GET /api/developers/:id -> Fetch developer details
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM developers WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Developer not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
