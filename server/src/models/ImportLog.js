const mongoose = require("mongoose");

const importLogSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true },

    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },

    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },

    totalFetched: { type: Number, default: 0 },
    totalImported: { type: Number, default: 0 },

    totalBatches: { type: Number, default: 0 },
    processedBatches: { type: Number, default: 0 },

    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },

    failedJobs: { type: Number, default: 0 },

    failedReasons: [
      {
        externalId: String,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImportLog", importLogSchema);
