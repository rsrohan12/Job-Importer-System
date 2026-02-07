const ImportLog = require("../models/ImportLog");
const { jobQueue } = require("../queue/jobQueue");

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function enqueueJobsImport({ sourceUrl, jobs, batchSize = 200 }) {
  const batches = chunkArray(jobs, batchSize);

  const log = await ImportLog.create({
    sourceUrl,
    status: "running",
    totalFetched: jobs.length,
    totalBatches: batches.length,
  });

  // If feed returned 0 jobs, complete immediately
  if (jobs.length === 0 || batches.length === 0) {
    await ImportLog.findByIdAndUpdate(log._id, {
      $set: {
        status: "completed",
        finishedAt: new Date(),
      },
    });

    return log;
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    await jobQueue.add(
      "import-jobs-batch",
      {
        importLogId: log._id.toString(),
        sourceUrl,
        batch,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
  }

  return log;
}

module.exports = { enqueueJobsImport };
