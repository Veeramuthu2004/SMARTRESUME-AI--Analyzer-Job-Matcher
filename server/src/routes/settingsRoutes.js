const express = require("express");
const { protect, requireAdmin } = require("../middleware/auth");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

router.get("/public", settingsController.getPublicSettings);
router.get("/", protect, requireAdmin, settingsController.getSettings);
router.put("/", protect, requireAdmin, settingsController.updateSettings);
router.patch(
  "/maintenance",
  protect,
  requireAdmin,
  settingsController.updateSettings,
);

module.exports = router;
