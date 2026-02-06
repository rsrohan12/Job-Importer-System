const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true, index: true },

    externalId: { type: String, required: true },

    title: { type: String },
    company: { type: String },
    location: { type: String },
    jobType: { type: String },
    category: { type: String },

    link: { type: String },
    description: { type: String },

    publishedAt: { type: Date },

    raw: { type: Object },
  },
  { timestamps: true }
);

// Unique per source
jobSchema.index({ sourceUrl: 1, externalId: 1 }, { unique: true });
jobSchema.index({ publishedAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
