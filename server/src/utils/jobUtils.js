// lightweight heuristics to extract company-like tokens from freeform job text
const extractCompanyFromText = (text = "") => {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();

  // common patterns: "Company: Acme Corp", "Company - Acme", "at Acme Corp"
  const patterns = [
    /Company\s*[:\-]\s*([A-Z][\w &.\-]{1,60})/i,
    /Employer\s*[:\-]\s*([A-Z][\w &.\-]{1,60})/i,
    /at\s+([A-Z][\w &.\-]{1,60}?)(?=[.,\n]|$)/i,
    /by\s+([A-Z][\w &.\-]{1,60}?)(?=[.,\n]|$)/i,
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m && m[1]) return m[1].trim();
  }

  // fallback: try first line tokens that look like a company name (two words starting with capital letters)
  const firstLine = trimmed.split(/\n/)[0] || "";
  const tok = firstLine.match(/([A-Z][\w&.\-]+\s+[A-Z][\w&.\-]+)/);
  if (tok && tok[1]) return tok[1].trim();

  return "";
};

module.exports = { extractCompanyFromText };
