const express = require("express");
const { searchJobs } = require("../controllers/jobsController");

const router = express.Router();

// Public search endpoint
router.get("/search", searchJobs);

module.exports = router;
