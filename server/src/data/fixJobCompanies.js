const mongoose = require("mongoose");
const db = require("../config/db");
const JobDescription = require("../models/JobDescription");
const { extractCompanyFromText } = require("../utils/jobUtils");

const run = async () => {
  try {
    await db();
    console.log("Connected to DB for backfill");

    const docs = await JobDescription.find({
      $or: [{ company: "" }, { company: null }],
    }).lean();
    console.log(`Found ${docs.length} job descriptions to inspect`);

    let updated = 0;
    for (const d of docs) {
      const inferred = extractCompanyFromText(d.description || "") || "";
      const newCompany = inferred || "Company not listed";
      if ((d.company || "") !== newCompany) {
        await JobDescription.updateOne(
          { _id: d._id },
          { $set: { company: newCompany } },
        );
        updated++;
        console.log(`Updated ${d._id} -> ${newCompany}`);
      }
    }

    console.log(`Backfill complete. Updated ${updated} documents.`);
    process.exit(0);
  } catch (err) {
    console.error("Backfill failed", err);
    process.exit(1);
  }
};

run();
