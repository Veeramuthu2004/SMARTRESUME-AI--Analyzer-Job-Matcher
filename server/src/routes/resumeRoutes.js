const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const resumeController = require("../controllers/resumeController");

const router = express.Router();

router.post(
  "/upload",
  protect,
  upload.single("resume"),
  resumeController.uploadResume,
);
router.get("/", protect, resumeController.listResumes);
router.get("/:id", protect, resumeController.getResumeById);
router.delete("/:id", protect, resumeController.deleteResume);

module.exports = router;
