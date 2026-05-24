const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const getRawCompany = (raw = {}) =>
  firstNonEmpty(
    raw.company,
    raw.company_name,
    raw.companyName,
    raw.employer_name,
    raw.employer,
    raw.company?.display_name,
    raw.company?.name,
    raw.raw?.company,
    raw.raw?.company_name,
    raw.raw?.companyName,
    raw.raw?.employer_name,
    raw.raw?.employer,
    raw.raw?.company?.display_name,
    raw.raw?.company?.name,
  );

const getRawLocation = (raw = {}) =>
  firstNonEmpty(
    raw.location,
    raw.location_name,
    raw.locationName,
    raw.job_city,
    raw.job_country,
    raw.location?.display_name,
    raw.location?.name,
    raw.raw?.location,
    raw.raw?.location_name,
    raw.raw?.locationName,
    raw.raw?.job_city,
    raw.raw?.job_country,
    raw.raw?.location?.display_name,
    raw.raw?.location?.name,
  );

export const normalizeJobDisplay = (job = {}) => {
  const raw = job.raw || job.rawJob || job;
  const company = getRawCompany(job) || "Company not listed";
  const location = getRawLocation(job) || "Location not listed";
  const title = firstNonEmpty(
    job.title,
    job.jobTitle,
    job.job_title,
    raw.title,
    raw.jobTitle,
    raw.job_title,
  );
  const description = firstNonEmpty(
    job.description,
    job.jobDescription,
    raw.description,
    raw.job_description,
  );
  const applyUrl = firstNonEmpty(
    job.applyUrl,
    job.apply_url,
    raw.applyUrl,
    raw.job_apply_link,
    raw.apply_url,
    raw.url,
    raw.redirect_url,
  );
  const employmentType = firstNonEmpty(
    job.employmentType,
    job.employment_type,
    raw.employmentType,
    raw.job_employment_type,
    raw.contract_time,
    raw.contract_type,
    raw.type,
  );
  const salary =
    job.salary ?? raw.salary ?? raw.salary_min ?? raw.salary_max ?? null;
  const requiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : Array.isArray(raw.requiredSkills)
      ? raw.requiredSkills
      : [];

  return {
    ...job,
    raw,
    company,
    location,
    title,
    description,
    applyUrl,
    employmentType,
    salary,
    requiredSkills,
  };
};
