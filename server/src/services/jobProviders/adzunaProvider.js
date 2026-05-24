const axios = require("axios");
const env = require("../../config/env");
const { detectSkills } = require("../../services/parserService");

const normalize = (item) => {
  const title = item.title || item.job_title || "";
  const company =
    item.company && item.company.display_name
      ? item.company.display_name
      : item.company || "";
  const loc =
    item.location && item.location.display_name
      ? item.location.display_name
      : item.location || item.location_raw || "";
  const description = item.description || item.summary || "";
  const requiredSkills = detectSkills(description);
  const applyUrl = item.redirect_url || item.redirect_url || item.url || "";
  const employmentType = item.contract_time || item.contract_type || "";
  const salary = item.salary_is_predicted
    ? item.salary_min
    : item.salary_min || null;
  const jobId = item.id || item.job_id || "";

  return {
    jobId,
    title,
    company,
    location: loc,
    description,
    requiredSkills,
    applyUrl,
    employmentType,
    salary,
    datePosted: item.created || null,
    raw: item,
  };
};

const search = async (params = {}) => {
  if (!env.adzunaAppId || !env.adzunaAppKey)
    throw new Error("Adzuna keys not configured");
  const page = Math.max(1, parseInt(params.page || 1, 10));
  const country = params.country || "us";
  const what =
    params.q ||
    params.role ||
    (params.skills || "").split(/,\s*/).join(" ") ||
    "";

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
  const r = await axios.get(url, {
    params: {
      app_id: env.adzunaAppId,
      app_key: env.adzunaAppKey,
      results_per_page: params.limit || env.jobsDefaultPageSize,
      what: what || undefined,
      where: params.location || undefined,
    },
    timeout: 10000,
  });

  const body = r.data || {};
  const rawItems = body.results || [];
  const items = rawItems.map(normalize);
  const total = body.count || items.length;
  return {
    items,
    pagination: { page, limit: params.limit || env.jobsDefaultPageSize, total },
  };
};

module.exports = { search };
