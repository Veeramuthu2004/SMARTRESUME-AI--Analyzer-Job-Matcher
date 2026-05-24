const JobDescription = require("../models/JobDescription");
const { extractCompanyFromText } = require("../utils/jobUtils");
const AdminLog = require("../models/AdminLog");

let backfillHandle = null;

const processBatch = async (batchSize = 50) => {
  const docs = await JobDescription.find({
    $or: [{ company: null }, { company: "" }],
  }).limit(batchSize);
  if (!docs || docs.length === 0) return { updated: 0 };
  let updated = 0;
  for (const d of docs) {
    try {
      const inferred = extractCompanyFromText(d.jobDescription || "") || "";
      if (inferred && inferred !== d.company) {
        d.company = inferred;
        await d.save();
        updated += 1;
        await AdminLog.create({
          admin: null,
          action: "backfill_job_company",
          metadata: { jobDescriptionId: d._id, company: inferred },
        });
      }
    } catch (e) {
      // ignore single doc failures
      // eslint-disable-next-line no-console
      console.warn("Backfill doc failed", d._id, e.message || e);
    }
  }
  return { updated };
};

const runBackfillOnce = async (opts = {}) => {
  const batchSize = opts.batchSize || 50;
  // run until no more docs or up to maxBatches per invocation
  const maxBatches = opts.maxBatches || 20;
  let totalUpdated = 0;
  for (let i = 0; i < maxBatches; i++) {
    // eslint-disable-next-line no-await-in-loop
    const result = await processBatch(batchSize);
    if (!result || !result.updated) break;
    totalUpdated += result.updated;
  }
  return { totalUpdated };
};

const startBackfillScheduler = ({ intervalMs = 24 * 60 * 60 * 1000 } = {}) => {
  if (backfillHandle) return;
  // run once immediately
  runBackfillOnce().catch((e) => {
    // eslint-disable-next-line no-console
    console.warn("Initial backfill failed", e.message || e);
  });
  backfillHandle = setInterval(() => {
    runBackfillOnce().catch((e) => {
      // eslint-disable-next-line no-console
      console.warn("Scheduled backfill failed", e.message || e);
    });
  }, intervalMs);
};

const stopBackfillScheduler = () => {
  if (backfillHandle) {
    clearInterval(backfillHandle);
    backfillHandle = null;
  }
};

module.exports = {
  processBatch,
  runBackfillOnce,
  startBackfillScheduler,
  stopBackfillScheduler,
};
