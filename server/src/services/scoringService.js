const { detectSkills } = require("./parserService");

const unique = (arr) => [...new Set(arr.map((x) => x.toLowerCase()))];

const computeScores = ({ resumeText, parsedSkills, jobDescription }) => {
  const jdSkills = detectSkills(jobDescription);
  const resumeSkills = unique([
    ...(parsedSkills || []),
    ...detectSkills(resumeText || ""),
  ]);

  const matchingSkills = jdSkills.filter((skill) =>
    resumeSkills.includes(skill.toLowerCase()),
  );
  const missingSkills = jdSkills.filter(
    (skill) => !resumeSkills.includes(skill.toLowerCase()),
  );

  const matchPercentage = jdSkills.length
    ? Math.round((matchingSkills.length / jdSkills.length) * 100)
    : 0;

  const keywordDensity = Math.min(
    100,
    Math.round((matchingSkills.length / Math.max(jdSkills.length, 1)) * 100),
  );
  const formattingScore = Math.min(
    100,
    70 + Math.round((resumeText.length / 3000) * 20),
  );
  const technicalScore = Math.min(
    100,
    40 + Math.round(matchingSkills.length * 8),
  );
  const semanticSimilarity =
    Math.round((matchPercentage * 0.7 + keywordDensity * 0.3) * 100) / 100;

  const atsScore = Math.round(
    formattingScore * 0.25 + keywordDensity * 0.4 + technicalScore * 0.35,
  );

  return {
    jdSkills,
    matchingSkills,
    missingSkills,
    matchPercentage,
    keywordScore: keywordDensity,
    formattingScore,
    technicalScore,
    semanticSimilarity,
    atsScore,
  };
};

module.exports = { computeScores };
