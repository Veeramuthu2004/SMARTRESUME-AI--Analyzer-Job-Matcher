const express = require("express");
const jobDescriptionController = require("../controllers/jobDescriptionController");

const router = express.Router();

// Public search endpoint (no auth required)
router.get("/search", jobDescriptionController.searchJobDescriptions);

// Match job description against user's resume(s)
const { protect } = require("../middleware/auth");
const { matchJobDescription } = require("../controllers/jobMatchController");
router.post("/match", protect, matchJobDescription);

module.exports = router;
