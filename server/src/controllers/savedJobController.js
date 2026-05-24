const asyncHandler = require("../utils/asyncHandler");
const SavedJob = require("../models/SavedJob");

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const extractCompany = (job = {}) =>
  firstNonEmpty(
    job.company,
    job.company_name,
    job.companyName,
    job.employer_name,
    job.employer,
    job.company?.display_name,
    job.company?.name,
    job.raw?.company,
    job.raw?.company_name,
    job.raw?.companyName,
    job.raw?.employer_name,
    job.raw?.employer,
    job.raw?.company?.display_name,
    job.raw?.company?.name,
  );

const extractLocation = (job = {}) =>
  firstNonEmpty(
    job.location,
    job.location_name,
    job.locationName,
    job.location?.display_name,
    job.location?.name,
    job.raw?.location,
    job.raw?.location_name,
    job.raw?.locationName,
    job.raw?.location?.display_name,
    job.raw?.location?.name,
  );

const saveJob = asyncHandler(async (req, res) => {
  const userId = req.user && req.user._id;
  const { job } = req.body;
  if (!job) return res.status(400).json({ message: "job is required" });
  const jobId = job.jobId || job.id || job.job_id || "";
  const title = job.title || job.jobTitle || job.job_title || "";
  if (!jobId || !title)
    return res.status(400).json({ message: "jobId and title are required" });

  // avoid duplicates
  const exists = await SavedJob.findOne({ user: userId, jobId }).lean();
  if (exists) return res.status(200).json({ saved: true, item: exists });

  const doc = await SavedJob.create({
    user: userId,
    jobId,
    title,
    company: extractCompany(job),
    location: extractLocation(job),
    rawJob: job,
  });

  res.status(201).json({ saved: true, item: doc });
});

const listSavedJobs = asyncHandler(async (req, res) => {
  const userId = req.user && req.user._id;
  const items = await SavedJob.find({ user: userId })
    .sort({ savedAt: -1 })
    .lean();
  res.json({ items });
});

const removeSavedJob = asyncHandler(async (req, res) => {
  const userId = req.user && req.user._id;
  const id = req.params.id;
  const doc = await SavedJob.findById(id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  if (doc.user.toString() !== userId.toString())
    return res.status(403).json({ message: "Not allowed" });
  await doc.remove();
  res.json({ removed: true });
});

module.exports = { saveJob, listSavedJobs, removeSavedJob };
