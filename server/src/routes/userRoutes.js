const express = require("express");
const { z } = require("zod");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const avatarUpload = require("../middleware/avatarUpload");
const {
  updateProfile,
  uploadAvatar,
  updatePreferences,
  deleteAccount,
  getNotifications,
} = require("../controllers/userController");

const router = express.Router();

router.put(
  "/profile",
  protect,
  validate(
    z.object({
      name: z.string().min(2).optional(),
      headline: z.string().max(120).optional(),
      avatarUrl: z.union([z.string().min(1), z.literal("")]).optional(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  updateProfile,
);

router.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);

router.put(
  "/preferences",
  protect,
  validate(
    z.object({
      emailNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    }),
  ),
  updatePreferences,
);

router.delete(
  "/account",
  protect,
  validate(
    z.object({
      password: z.string().min(1).optional(),
      confirmation: z.string().optional(),
    }),
  ),
  deleteAccount,
);

router.get("/notifications", protect, getNotifications);

module.exports = router;
