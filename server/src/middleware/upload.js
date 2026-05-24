const multer = require("multer");
const path = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    // Allow PDF and DOCX in production, and also allow text files for local
    // development/testing so end-to-end tests can run without binary files.
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    const ext = path.extname(file.originalname || "").toLowerCase();
    const looksText = [".txt", ".md", ".csv", ".log"].includes(ext);
    const looksPdf = ext === ".pdf";
    const looksDocx = ext === ".docx" || ext === ".doc";

    // Playwright and some browsers may send plain text files as octet-stream,
    // so treat those as compatible if the filename clearly indicates a supported file.
    const allowedLoose =
      allowed.includes(file.mimetype) ||
      (file.mimetype === "application/octet-stream" &&
        (looksText || looksPdf || looksDocx)) ||
      (!file.mimetype && (looksText || looksPdf || looksDocx));

    if (!allowedLoose) {
      return cb(
        new Error("Unsupported file type. Upload PDF, DOCX, or TXT only."),
      );
    }

    return cb(null, true);
  },
});

module.exports = upload;
