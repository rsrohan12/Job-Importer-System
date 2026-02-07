require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const connectDB = require("./config/db");
const { fetchJobsFromFeed } = require("./services/feedService");
const { enqueueJobsImport } = require("./services/importService");

const importLogsRoutes = require("./routes/importLogs.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/import-logs", importLogsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const FEED_URLS = [
  "https://jobicy.com/?feed=job_feed",
  "https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time",
  "https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france",
  "https://jobicy.com/?feed=job_feed&job_categories=design-multimedia",
  "https://jobicy.com/?feed=job_feed&job_categories=data-science",
  "https://jobicy.com/?feed=job_feed&job_categories=copywriting",
  "https://jobicy.com/?feed=job_feed&job_categories=business",
  "https://jobicy.com/?feed=job_feed&job_categories=management",
  "https://www.higheredjobs.com/rss/articleFeed.cfm",
];

// Manual trigger (for testing)
app.post("/api/import/run", async (req, res) => {
  try {
    const batchSize = Number(req.body?.batchSize || 200);

    const logs = [];

    for (const url of FEED_URLS) {
      const jobs = await fetchJobsFromFeed(url);
      const log = await enqueueJobsImport({ sourceUrl: url, jobs, batchSize });
      logs.push(log);
    }

    res.json({ message: "Import queued", logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

async function start() {
  await connectDB();

  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Cron started: fetching feeds");

    for (const url of FEED_URLS) {
      try {
        const jobs = await fetchJobsFromFeed(url);
        await enqueueJobsImport({ sourceUrl: url, jobs, batchSize: 200 });
        console.log(`✅ Queued import: ${url} (${jobs.length})`);
      } catch (err) {
        console.error(`❌ Feed import failed for ${url}:`, err.message);
      }
    }
  });

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
}

start();
