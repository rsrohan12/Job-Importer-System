const { Queue } = require("bullmq");
const connection = require("../config/redis");

const JOB_IMPORT_QUEUE = "job-import-queue";

const jobQueue = new Queue(JOB_IMPORT_QUEUE, {
  connection,
  prefix: "job-importer",
});

module.exports = { jobQueue, JOB_IMPORT_QUEUE };
