const JobDescription = require("../models/JobDescription");
const asyncHandler = require("../utils/asyncHandler");
const { detectSkills } = require("../services/parserService");

const searchJobDescriptions = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  const role = (req.query.role || "").trim();
  const location = (req.query.location || "").trim();
  const skillsParam = (req.query.skills || "").trim();
  const skills = skillsParam
    ? skillsParam.split(/,\s*/).map((s) => s.toLowerCase())
    : [];
  if (!q) return res.status(400).json({ message: "Query is required" });

  // If no explicit skills provided, try to detect from the query text
  const detected = detectSkills(q);
  const allSkills = Array.from(new Set([...detected, ...skills]));

  const query = {
    $or: [],
  };

  if (allSkills.length > 0) {
    query.$or.push({ requiredSkills: { $in: allSkills } });
  }

  if (role) {
    query.$or.push({
      title: new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    });
  }

  if (location) {
    query.$or.push({
      location: new RegExp(
        location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      ),
    });
  }

  // also match text in title/company/description
  const terms = q
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (terms.length > 0) {
    const regex = new RegExp(terms.join("|"), "i");
    query.$or.push(
      { title: regex },
      { company: regex },
      { description: regex },
    );
  }

  // remove $or if empty
  const finalQuery = query.$or.length > 0 ? query : {};

  const items = await JobDescription.find(finalQuery)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return res.json({ items });
});

module.exports = { searchJobDescriptions };
