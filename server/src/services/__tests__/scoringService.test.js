const test = require("node:test");
const assert = require("node:assert/strict");
const { computeScores } = require("../scoringService");

test("computeScores returns higher ATS when skills match JD", () => {
  const result = computeScores({
    resumeText:
      "Experienced React Node.js developer with MongoDB and REST APIs",
    parsedSkills: ["react", "node.js", "mongodb"],
    jobDescription:
      "Looking for React and Node.js engineer with MongoDB experience and REST API skills",
  });

  assert.ok(
    result.atsScore >= 50,
    "ATS should be reasonably high for good match",
  );
  assert.ok(result.matchingSkills.length >= 2, "Should detect matching skills");
});

test("computeScores handles empty JD safely", () => {
  const result = computeScores({
    resumeText: "Anything",
    parsedSkills: [],
    jobDescription: "",
  });

  assert.equal(result.matchPercentage, 0);
  assert.ok(Number.isFinite(result.atsScore));
});
