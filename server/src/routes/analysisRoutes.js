const express = require("express");
const { z } = require("zod");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const analysisController = require("../controllers/analysisController");

const router = express.Router();

router.post(
  "/",
  protect,
  validate(
    z.object({
      resumeId: z.string().min(1),
      roleTitle: z.string().optional(),
      company: z.string().optional(),
      jobDescription: z.string().min(50),
    }),
  ),
  analysisController.analyzeResume,
);

router.get("/", protect, analysisController.listAnalyses);
router.get("/:id/export/pdf", protect, analysisController.exportAnalysisPdf);
router.get("/:id", protect, analysisController.getAnalysisById);
router.delete("/:id", protect, analysisController.deleteAnalysis);

module.exports = router;
