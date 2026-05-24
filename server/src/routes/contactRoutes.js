const express = require("express");
const { z } = require("zod");
const validate = require("../middleware/validate");
const { submitContactMessage } = require("../controllers/contactController");

const router = express.Router();

router.post(
  "/",
  validate(
    z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      message: z.string().min(10),
    }),
  ),
  submitContactMessage,
);

module.exports = router;
