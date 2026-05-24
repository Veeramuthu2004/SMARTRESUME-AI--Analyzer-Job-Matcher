const axios = require("axios");
const env = require("../config/env");

/**
 * AI Service abstraction. Supports calling a Gemini-compatible endpoint.
 *
 * To enable, set environment variables:
 * - GEMINI_API_KEY (the key)
 * - GEMINI_API_URL (the full endpoint URL that accepts POST JSON { prompt })
 *
 * The implementation is intentionally generic so you can point GEMINI_API_URL
 * to whichever hosted API gateway / proxy you use for Gemini/OpenAI.
 */

const isEnabled = () => !!(env.geminiApiKey && env.geminiApiUrl);

const generateMatchEnhancements = async ({ resumeText, jobText, matchingSkills, missingSkills }) => {
  if (!isEnabled()) return null;

  const prompt = `You are an expert resume coach. Given the job description:\n\n${jobText}\n\nAnd the candidate resume:\n\n${resumeText}\n\nMatching skills: ${matchingSkills.join(", ")}\nMissing skills: ${missingSkills.join(", ")}\n\nProvide:\n1) A short human-friendly list of improvement suggestions (3 bullet points).\n2) A concise interview prep list of 3 technical questions.\n3) A one-paragraph cover letter draft tailored to the job description.\nRespond in JSON with keys: suggestions (array), interviewPrep (array), coverLetter (string).`;

  try {
    const resp = await axios.post(
      env.geminiApiUrl,
      { prompt },
      {
        headers: {
          Authorization: `Bearer ${env.geminiApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    const data = resp.data;
    if (!data) return null;

    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (e) {
        return { suggestions: [data], interviewPrep: [], coverLetter: data };
      }
    }

    if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
      const txt = data.choices[0].text || data.choices[0].message?.content || null;
      if (!txt) return data;
      try {
        return JSON.parse(txt);
      } catch (e) {
        return { suggestions: [txt], interviewPrep: [], coverLetter: txt };
      }
    }

    return data;
  } catch (err) {
    console.error("AI service error:", err?.message || err);
    return null;
  }
};

module.exports = { isEnabled, generateMatchEnhancements };
