const MenstrualRecord = require("../models/MenstrualRecord");
const mongoose = require("mongoose");

// POST /api/records
exports.createRecord = async (req, res) => {
  try {
    const { lastPeriodDate, cycleLength, symptoms, notes } = req.body;

    if (!lastPeriodDate || cycleLength === undefined) {
      return res.status(400).json({
        message: "lastPeriodDate and cycleLength are required",
      });
    }

    const record = await MenstrualRecord.create({
      lastPeriodDate,
      cycleLength,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || "",
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/records  (Get all records)
exports.getAllRecords = async (req, res) => {
  try {
    const records = await MenstrualRecord.find().sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/records/:id  (Get one record)
exports.getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await MenstrualRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/records/:id
exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await MenstrualRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const { lastPeriodDate, cycleLength, symptoms, notes } = req.body;

    if (lastPeriodDate !== undefined) record.lastPeriodDate = lastPeriodDate;
    if (cycleLength !== undefined) record.cycleLength = cycleLength;
    if (symptoms !== undefined)
      record.symptoms = Array.isArray(symptoms) ? symptoms : [];
    if (notes !== undefined) record.notes = notes;

    const updated = await record.save();

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/records/:id
exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await MenstrualRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    await MenstrualRecord.deleteOne({ _id: id });

    res.status(200).json({ message: "Record deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};