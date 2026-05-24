// lightweight client-side extractor for company names from job description text
export const extractCompanyFromText = (text = "") => {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();

  const patterns = [
    /Company\s*[:\-]\s*([A-Z][\w &.\-]{1,60})/i,
    /Employer\s*[:\-]\s*([A-Z][\w &.\-]{1,60})/i,
    /at\s+([A-Z][\w &.\-]{1,60})(?:[.,\n]|$)/i,
    /by\s+([A-Z][\w &.\-]{1,60})(?:[.,\n]|$)/i,
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m && m[1]) return m[1].trim();
  }

  const firstLine = trimmed.split(/\n/)[0] || "";
  const tok = firstLine.match(/([A-Z][\w&.\-]+\s+[A-Z][\w&.\-]+)/);
  if (tok && tok[1]) return tok[1].trim();

  return "";
};
