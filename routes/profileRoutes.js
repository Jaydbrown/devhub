const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
} = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

//  Get profile (no user_id needed)
router.get("/", authMiddleware, getProfile);

//  Update profile
router.put("/", authMiddleware, updateProfile);

//  Change password
router.put("/password", authMiddleware, changePassword);

module.exports = router;
