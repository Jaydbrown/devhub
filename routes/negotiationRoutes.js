const express = require("express");
const router = express.Router();
const {
    startNegotiation,
    updateNegotiationStatus,
} = require("../controllers/negotiationController");

router.post("/", startNegotiation);
router.put("/status", updateNegotiationStatus);

module.exports = router;
