require("dotenv").config();

const { Worker } = require("bullmq");
const connection = require("./config/redis");
const connectDB = require("./config/db");
const http = require("http");
const Job = require("./models/Job");
const ImportLog = require("./models/ImportLog");
const { JOB_IMPORT_QUEUE } = require("./queue/jobQueue");

function buildBulkOps(batch) {
  return batch.map((job) => ({
    updateOne: {
      filter: { sourceUrl: job.sourceUrl, externalId: job.externalId },
      update: {
        $set: {
          title: job.title,
          company: job.company,
          location: job.location,
          jobType: job.jobType,
          category: job.category,
          link: job.link,
          description: job.description,
          publishedAt: job.publishedAt,
          raw: job.raw,
        },
      },
      upsert: true,
    },
  }));
}

async function processBatch(job) {
  const { importLogId, batch } = job.data;

  // Bulk write
  const ops = buildBulkOps(batch);

  try {
    const result = await Job.bulkWrite(ops, { ordered: false });

    const inserted = result.upsertedCount || 0;
    const updated = result.matchedCount || 0;

    // Update log
    const updatedLog = await ImportLog.findByIdAndUpdate(
      importLogId,
      {
        $inc: {
          totalImported: inserted + updated,
          newJobs: inserted,
          updatedJobs: updated,
          processedBatches: 1,
        },
      },
      { new: true },
    );

    if (updatedLog.processedBatches >= updatedLog.totalBatches) {
      await ImportLog.findByIdAndUpdate(importLogId, {
        $set: {
          status: "completed",
          finishedAt: new Date(),
        },
      });
    }

    return { inserted, updated };
  } catch (err) {
    // If bulkWrite fails, mark all batch jobs as failed reasons
    const reasons = batch.slice(0, 30).map((j) => ({
      externalId: j.externalId,
      reason: err.message,
    }));

    const updatedLog = await ImportLog.findByIdAndUpdate(
      importLogId,
      {
        $inc: {
          failedJobs: batch.length,
          processedBatches: 1,
        },
        $push: { failedReasons: { $each: reasons } },
      },
      { new: true },
    );

    if (updatedLog.processedBatches >= updatedLog.totalBatches) {
      await ImportLog.findByIdAndUpdate(importLogId, {
        $set: {
          status: "completed",
          finishedAt: new Date(),
        },
      });
    }

    throw err;
  }
}

async function startWorker() {
  await connectDB();

  const worker = new Worker(
    JOB_IMPORT_QUEUE,
    async (job) => processBatch(job),
    {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
      prefix: "job-importer",
    },
  );

  worker.on("completed", () => {});
  worker.on("failed", (job, err) => {
    console.error("❌ Worker job failed:", job?.id, err.message);
  });

  console.log("✔️ Worker started");
}

startWorker();

// Dummy server for render to keep the worker as web service

const PORT = process.env.PORT || 10000;

http
  .createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Worker running");
  })
  .listen(PORT, () => {
    console.log(`🟢 Worker listening on ${PORT}`);
  });
