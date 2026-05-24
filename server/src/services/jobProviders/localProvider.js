const JobDescription = require("../../models/JobDescription");
const { detectSkills } = require("../../services/parserService");

const getDemoJobs = () => [
  {
    jobId: "demo-frontend-1",
    title: "Senior Frontend Engineer",
    company: "Acme",
    location: "Remote",
    description:
      "We are seeking a Senior Frontend Engineer with strong React, TypeScript, Node.js and MongoDB experience.",
    requiredSkills: ["javascript", "typescript", "react", "node.js", "mongodb"],
    applyUrl: "",
    employmentType: "Full-time",
    salary: null,
    raw: { demo: true },
  },
];

const search = async (params = {}) => {
  const q = (params.q || "").trim();
  const role = (params.role || "").trim();
  const location = (params.location || "").trim();
  const skillsParam = (params.skills || "").trim();
  const skills = skillsParam
    ? skillsParam.split(/,\s*/).map((s) => s.toLowerCase())
    : [];
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.max(1, parseInt(params.limit || 20, 10));

  const detected = detectSkills(q || role);
  const allSkills = Array.from(new Set([...(detected || []), ...skills]));

  const query = { $or: [] };
  if (allSkills.length > 0)
    query.$or.push({ requiredSkills: { $in: allSkills } });
  if (role)
    query.$or.push({
      title: new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    });
  if (location)
    query.$or.push({
      location: new RegExp(
        location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      ),
    });

  const terms = (q || "")
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

  const finalQuery = query.$or.length > 0 ? query : {};
  const total = await JobDescription.countDocuments(finalQuery);
  const docs = await JobDescription.find(finalQuery)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const items = (docs || []).map((d) => ({
    jobId: d._id.toString(),
    title: d.title,
    company: d.company || "Company not listed",
    location: d.location || "Remote",
    description: d.description,
    requiredSkills: d.requiredSkills || detectSkills(d.description || ""),
    applyUrl: "",
    raw: d,
  }));

  if (items.length === 0 && (q || role || location || skills.length > 0)) {
    const demoJobs = getDemoJobs().filter((job) => {
      const haystack =
        `${job.title} ${job.company} ${job.description}`.toLowerCase();
      return [q, role, location, ...skills]
        .filter(Boolean)
        .some((term) => haystack.includes(String(term).toLowerCase()));
    });

    return {
      items: demoJobs.length > 0 ? demoJobs : getDemoJobs(),
      pagination: {
        page,
        limit,
        total: demoJobs.length > 0 ? demoJobs.length : getDemoJobs().length,
      },
    };
  }

  return { items, pagination: { page, limit, total } };
};

module.exports = { search };
