const express = require("express");
const {
  saveJob,
  listSavedJobs,
  removeSavedJob,
} = require("../controllers/savedJobController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, saveJob);
router.get("/", protect, listSavedJobs);
router.delete("/:id", protect, removeSavedJob);

module.exports = router;
