const express = require("express");
const ImportLog = require("../models/ImportLog");

const router = express.Router();

// GET /api/import-logs?page=1&limit=10&sourceUrl=...
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const filter = {};
    if (req.query.sourceUrl) {
      filter.sourceUrl = req.query.sourceUrl;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ImportLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ImportLog.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/import-logs/:id
router.get("/:id", async (req, res) => {
  try {
    const log = await ImportLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
