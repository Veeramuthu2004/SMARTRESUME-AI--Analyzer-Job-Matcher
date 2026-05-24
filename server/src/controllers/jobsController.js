const asyncHandler = require("../utils/asyncHandler");
const providerFactory = require("../services/jobProviders/providerFactory");

const searchJobs = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  const role = (req.query.role || "").trim();
  const location = (req.query.location || "").trim();
  const skillsParam = (req.query.skills || "").trim();
  const skills = skillsParam
    ? skillsParam.split(/,\s*/).map((s) => s.toLowerCase())
    : [];

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(
    1,
    parseInt(req.query.limit || env.jobsDefaultPageSize, 10),
  );
  const providerOverride = req.query.provider || "";
  try {
    const result = await providerFactory.search({
      q,
      role,
      location,
      skills: skills.join(","),
      page,
      limit,
      provider: providerOverride,
    });
    return res.json(result);
  } catch (err) {
    console.warn(
      "jobs provider failed, using local fallback:",
      err?.message || err,
    );
    const local = await providerFactory.getProvider("local").search({
      q,
      role,
      location,
      skills: skills.join(","),
      page,
      limit,
    });
    return res.json(local);
  }
});

module.exports = { searchJobs };
