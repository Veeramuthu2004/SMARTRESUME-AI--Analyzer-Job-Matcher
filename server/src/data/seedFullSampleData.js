const mongoose = require("mongoose");
const connectDb = require("../config/db");
const User = require("../models/User");
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");

const run = async () => {
  await connectDb();

  // Create test user
  let user = await User.findOne({ email: "tester@smartresume.dev" });
  if (!user) {
    user = await User.create({
      name: "UI Test User",
      email: "tester@smartresume.dev",
      password: "Test12345!",
      role: "user",
      skills: ["React", "Node.js", "MongoDB"],
      headline: "Frontend Engineer",
    });
    console.log("Created test user: tester@smartresume.dev / Test12345!");
  } else {
    console.log("Test user already exists");
  }

  // Create a sample resume
  let resume = await Resume.findOne({ user: user._id });
  if (!resume) {
    resume = await Resume.create({
      user: user._id,
      fileName: "sample_resume.txt",
      mimeType: "text/plain",
      size: 1024,
      rawText: `John Doe\nExperienced Software Engineer\nSkills: React, Node.js, MongoDB\nExperience: 5 years`,
      parsed: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 555 123 4567",
        skills: ["React", "Node.js", "MongoDB"],
        education: ["B.S. Computer Science"],
        experience: ["Company A - Senior Engineer (2019-2024)"],
        summary:
          "Seasoned full-stack engineer with a focus on frontend development.",
      },
    });
    console.log("Created sample resume for test user");
  } else {
    console.log("Sample resume already exists for test user");
  }

  // Create a few analyses
  const existing = await Analysis.find({ user: user._id }).limit(1);
  if (existing.length === 0) {
    const samples = [
      {
        user: user._id,
        resume: resume._id,
        jobDescription:
          "We need a Senior Frontend Engineer with React, TypeScript, Tailwind and strong UI skills.",
        roleTitle: "Senior Frontend Engineer",
        matchPercentage: 82,
        matchingSkills: ["React", "Tailwind", "TypeScript"],
        missingSkills: ["GraphQL"],
        semanticSimilarity: 0.84,
        atsScore: 78,
        formattingScore: 85,
        keywordScore: 80,
        technicalScore: 75,
        suggestions: ["Add GraphQL experience", "Include more project details"],
        recommendations: [
          "Highlight TypeScript projects",
          "Add keywords from JD",
        ],
      },
      {
        user: user._id,
        resume: resume._id,
        jobDescription:
          "Backend Engineer role requiring Node.js, Express, and MongoDB experience.",
        roleTitle: "Backend Engineer",
        matchPercentage: 74,
        matchingSkills: ["Node.js", "MongoDB"],
        missingSkills: ["Docker"],
        semanticSimilarity: 0.72,
        atsScore: 70,
        formattingScore: 80,
        keywordScore: 68,
        technicalScore: 74,
        suggestions: ["Add Docker and deployment experience"],
        recommendations: ["List CI/CD tools and deployment notes"],
      },
    ];

    await Analysis.insertMany(samples);
    console.log("Inserted sample analyses for test user");
  } else {
    console.log("Analyses already exist for test user");
  }

  await mongoose.disconnect();
  console.log("Seeding complete");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
