const Resume = require("../models/Resume");
const asyncHandler = require("../utils/asyncHandler");
const { getIo } = require("../services/socketService");
const { parseUploadedResume } = require("../services/parserService");

const uploadResume = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file)
    return res.status(400).json({ message: "Resume file is required" });

  const { text, parsed } = await parseUploadedResume(file);

  const resume = await Resume.create({
    user: req.user._id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    rawText: text,
    parsed,
  });

  // emit event to admin dashboard about new resume
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "resume_uploaded",
      resume: {
        _id: resume._id,
        user: resume.user,
        fileName: resume.fileName,
        createdAt: resume.createdAt,
      },
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "New resume uploaded",
      message: `${req.user.email || req.user._id} uploaded ${resume.fileName}`,
      resumeId: resume._id,
    });
    // notify the uploading user so their UI can react (e.g., refresh resume list)
    try {
      io.to(`user:${String(req.user._id)}`).emit("resume:uploaded", {
        resumeId: resume._id,
        fileName: resume.fileName,
      });
    } catch (emitErr) {
      // ignore
    }
  } catch (e) {}

  return res.status(201).json({ resume });
});

const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.json({ resumes });
});

const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!resume) return res.status(404).json({ message: "Resume not found" });
  return res.json({ resume });
});

const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!resume) return res.status(404).json({ message: "Resume not found" });
  return res.json({ message: "Resume deleted", resume });
});

module.exports = {
  uploadResume,
  listResumes,
  getResumeById,
  deleteResume,
};
