require("dotenv").config();

const { Worker } = require("bullmq");
const http = require("http");

const connection = require("./config/redis");
const connectDB = require("./config/db");

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
  const { importLogId, batch, sourceUrl } = job.data;

  console.log(
    `📦 Processing queue job=${job.id} | batchSize=${batch?.length} | source=${sourceUrl}`,
  );

  const ops = buildBulkOps(batch);

  try {
    const result = await Job.bulkWrite(ops, { ordered: false });

    const inserted = result.upsertedCount || 0;
    const updated = result.matchedCount || 0;

    console.log(
      `✅ bulkWrite done | inserted=${inserted} | updated=${updated} | job=${job.id}`,
    );

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

    console.log(
      `🧾 Log updated | importLogId=${importLogId} | processed=${updatedLog.processedBatches}/${updatedLog.totalBatches}`,
    );

    if (updatedLog.processedBatches >= updatedLog.totalBatches) {
      await ImportLog.findByIdAndUpdate(importLogId, {
        $set: {
          status: "completed",
          finishedAt: new Date(),
        },
      });

      console.log(`🏁 Import completed | importLogId=${importLogId}`);
    }

    return { inserted, updated };
  } catch (err) {
    console.error(
      `❌ bulkWrite failed | job=${job.id} | importLogId=${importLogId} | error=${err.message}`,
    );

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

    console.log(
      `🧾 Failure logged | importLogId=${importLogId} | processed=${updatedLog.processedBatches}/${updatedLog.totalBatches}`,
    );

    if (updatedLog.processedBatches >= updatedLog.totalBatches) {
      await ImportLog.findByIdAndUpdate(importLogId, {
        $set: {
          status: "completed",
          finishedAt: new Date(),
        },
      });

      console.log(`🏁 Import completed (with failures) | importLogId=${importLogId}`);
    }

    throw err;
  }
}

async function startWorker() {
  console.log("🔄 Starting worker...");
  await connectDB();
  console.log("✅ MongoDB connected (worker)");

  const worker = new Worker(JOB_IMPORT_QUEUE, processBatch, {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
    prefix: "job-importer",
  });

  worker.on("ready", () => {
    console.log("🟢 BullMQ worker is ready and listening to queue");
  });

  worker.on("completed", (job) => {
    console.log(`🎉 Job completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error("❌ Worker job failed:", job?.id, err.message);
  });

  worker.on("error", (err) => {
    console.error("🔥 Worker error:", err.message);
  });

  console.log("✔️ Worker started");
}

startWorker().catch((err) => {
  console.error("❌ Worker failed to start:", err);
  process.exit(1);
});

/**
 * Dummy HTTP server so Render can health-check this service.
 */
const PORT = process.env.PORT || 10000;

http
  .createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Worker running");
  })
  .listen(PORT, () => {
    console.log(`🟢 Worker health server listening on ${PORT}`);
  });
