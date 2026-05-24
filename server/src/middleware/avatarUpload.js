const multer = require("multer");

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(
        new Error(
          "Unsupported file type. Upload a PNG, JPG, JPEG, or WebP image.",
        ),
      );
    }

    return cb(null, true);
  },
});

module.exports = avatarUpload;
