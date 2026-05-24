const axios = require("axios");
const env = require("../../config/env");
const { detectSkills } = require("../../services/parserService");

const normalize = (item) => {
  const title = item.job_title || item.title || item.position || "";
  const company = item.employer_name || item.company || item.employer || "";
  const loc =
    [item.job_city, item.job_country, item.location]
      .filter(Boolean)
      .join(", ") ||
    item.location ||
    "";
  const description =
    item.job_description || item.description || item.snippet || "";
  const requiredSkills =
    item.job_highlights?.length > 0
      ? item.job_highlights
      : detectSkills(description);
  const applyUrl =
    item.job_apply_link ||
    item.apply_url ||
    item.url ||
    item.redirect_url ||
    "";
  const employmentType = item.job_employment_type || item.type || "";
  const salary = item.salary || null;
  const jobId = item.job_id || item.id || item.job_id_original || "";

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
    datePosted: item.job_post_date || item.posted_at || null,
    raw: item,
  };
};

const search = async (params = {}) => {
  if (!env.jobsRapidApiKey)
    throw new Error("JSearch RapidAPI key is not configured");

  const page = Math.max(1, parseInt(params.page || 1, 10));
  const rapidHost = env.jobsRapidApiHost || "jsearch.p.rapidapi.com";

  const query =
    params.q ||
    params.role ||
    (params.skills || "").split(/,\s*/).join(" ") ||
    "";

  const headers = {
    "X-RapidAPI-Key": env.jobsRapidApiKey,
    "X-RapidAPI-Host": rapidHost,
  };

  const r = await axios.get("https://jsearch.p.rapidapi.com/search", {
    params: {
      query,
      page,
      num_pages: 1,
      location: params.location || undefined,
    },
    headers,
    timeout: 10000,
  });

  const body = r.data || {};
  const rawItems = body.data || body.jobs || [];
  const items = rawItems.map(normalize);
  const total = body.total || items.length;
  return {
    items,
    pagination: { page, limit: params.limit || env.jobsDefaultPageSize, total },
  };
};

module.exports = { search };
