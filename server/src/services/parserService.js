const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("path");

const unique = (arr) => [...new Set(arr.map((x) => x.trim()).filter(Boolean))];

const detectSkills = (text) => {
  const aliases = [
    ["javascript", "javascript", "js"],
    ["typescript", "typescript", "ts"],
    ["react", "react"],
    ["node.js", "node.js", "nodejs", "node"],
    ["express", "express", "express.js"],
    ["mongodb", "mongodb", "mongo db"],
    ["sql", "sql", "postgres", "postgresql", "mysql"],
    ["python", "python"],
    ["java", "java"],
    ["docker", "docker"],
    ["kubernetes", "kubernetes", "k8s"],
    ["aws", "aws", "amazon web services"],
    ["azure", "azure"],
    ["gcp", "gcp", "google cloud"],
    ["redis", "redis"],
    ["graphql", "graphql"],
    ["rest", "rest", "rest api", "api"],
    ["tailwind", "tailwind", "tailwind css"],
    ["next.js", "next.js", "nextjs"],
    ["machine learning", "machine learning", "ml"],
    ["nlp", "nlp", "natural language processing"],
  ];

  const normalized = text.toLowerCase();
  return unique(
    aliases
      .filter(([, ...terms]) => terms.some((term) => normalized.includes(term)))
      .map(([canonical]) => canonical),
  );
};

const parseContact = (text) => {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone =
    text.match(
      /(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/,
    )?.[0] || "";
  return { email, phone };
};

const splitSections = (text, keyword) => {
  return text
    .split(/\n+/)
    .filter((line) => line.toLowerCase().includes(keyword))
    .slice(0, 8);
};

const parseResumeText = (text) => {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const name = lines[0] || "Candidate";
  const contact = parseContact(text);

  return {
    name,
    ...contact,
    summary: lines.slice(1, 6).join(" ").slice(0, 500),
    skills: detectSkills(text),
    education: splitSections(text, "university").concat(
      splitSections(text, "bachelor"),
    ),
    experience: splitSections(text, "experience").concat(
      splitSections(text, "engineer"),
    ),
    certifications: splitSections(text, "cert").concat(
      splitSections(text, "aws"),
    ),
    projects: splitSections(text, "project").concat(
      splitSections(text, "built"),
    ),
  };
};

const parseUploadedResume = async (file) => {
  if (!file) throw new Error("Resume file is required");

  let text = "";
  try {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mimetype = (file.mimetype || "").toLowerCase();
    const looksLikeText =
      mimetype.includes("text") ||
      mimetype === "application/octet-stream" ||
      [".txt", ".md", ".csv", ".log"].includes(ext);

    if (mimetype.includes("pdf") || ext === ".pdf") {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const parsed = await parser.getText();
        text = parsed.text || "";
      } finally {
        await parser.destroy?.();
      }
    } else if (looksLikeText) {
      text = file.buffer.toString("utf8");
    } else {
      // Assume DOCX/Word otherwise
      try {
        const parsed = await mammoth.extractRawText({ buffer: file.buffer });
        text = parsed.value || "";
      } catch (_docxErr) {
        // Fallback to utf8 for plain text or unknown files that still contain readable text.
        text = file.buffer.toString("utf8");
      }
    }
  } catch (err) {
    // If parsing fails, return a helpful error to the caller
    const error = new Error("Failed to parse resume: " + (err.message || err));
    error.statusCode = 400;
    throw error;
  }

  const parsed = parseResumeText(text);
  return { text, parsed };
};

module.exports = {
  parseUploadedResume,
  parseResumeText,
  detectSkills,
};
