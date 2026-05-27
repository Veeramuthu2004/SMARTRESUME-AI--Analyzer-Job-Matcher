const express = require("express");
const { z } = require("zod");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const authController = require("../controllers/authController");

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/register", validate(signupSchema), authController.signup);

router.post(
  "/login",
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  ),
  authController.login,
);

router.post(
  "/google",
  validate(z.object({ idToken: z.string().min(10) })),
  authController.googleLogin,
);

router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post(
  "/forgot-password",
  validate(z.object({ email: z.string().email() })),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  validate(
    z.object({
      email: z.string().email(),
      token: z.string().min(10),
      newPassword: z.string().min(8),
    }),
  ),
  authController.resetPassword,
);

router.get("/me", protect, authController.me);

module.exports = router;
