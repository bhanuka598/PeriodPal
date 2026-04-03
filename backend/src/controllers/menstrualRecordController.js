const MenstrualRecord = require("../models/MenstrualRecord");
const mongoose = require("mongoose");
const User = require("../models/User");

const transporter = require("../utils/emailService");

// POST /api/records
exports.createRecord = async (req, res) => {
  try {
    const { lastPeriodDate,flowIntensity, cycleLength, symptoms, notes } = req.body;

    if (!lastPeriodDate || cycleLength === undefined) {
      return res.status(400).json({
        message: "lastPeriodDate and cycleLength are required",
      });
    }

    const record = await MenstrualRecord.create({
      lastPeriodDate,
      cycleLength,
      flowIntensity,
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

    const { lastPeriodDate, flowIntensity, cycleLength, symptoms, notes } = req.body;

    if (lastPeriodDate !== undefined) record.lastPeriodDate = lastPeriodDate;
    if (cycleLength !== undefined) record.cycleLength = cycleLength;
    if(flowIntensity !== undefined)record.flowIntensity=flowIntensity;
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

// POST /api/records/:id/send-email (Third-party Feature: Nodemailer)
exports.sendReminderEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { toEmail } = req.body;

    if (!toEmail) {
      return res.status(400).json({ message: "toEmail is required" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        message: "Email service not configured. Check EMAIL_USER and EMAIL_PASS in .env",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await MenstrualRecord.findById(id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Predict next period date
    const last = new Date(record.lastPeriodDate);
    const next = new Date(last);
    next.setDate(next.getDate() + Number(record.cycleLength));

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: "PeriodPal Reminder",
      text: `PeriodPal Reminder: Your next period is expected around ${next.toDateString()}.`,
      html: `
        <h2>PeriodPal Reminder</h2>
        <p>Your next period is expected around:</p>
        <h3>${next.toDateString()}</h3>
        <p><strong>Cycle length:</strong> ${record.cycleLength} days</p>
        <p><strong>Notes:</strong> ${record.notes || "-"}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Reminder email sent successfully",
      predictedNextPeriod: next,
    });
  } catch (err) {
    return res.status(500).json({ message: "Email sending failed", error: err.message });
  }
};

// GET /api/records/admin/all (Admin only - get all records with beneficiary info)
exports.getAllRecordsAdmin = async (req, res) => {
  try {
    const { beneficiaryId } = req.query;
    
    let query = {};
    if (beneficiaryId) {
      query.userId = beneficiaryId;
    }
    
    const records = await MenstrualRecord.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    
    // Calculate analytics
    const totalBeneficiaries = await MenstrualRecord.distinct('userId');
    const allRecords = await MenstrualRecord.find();
    
    const analytics = {
      totalBeneficiaries: totalBeneficiaries.length,
      totalRecords: allRecords.length,
      averageCycleLength: allRecords.length > 0 
        ? Math.round(allRecords.reduce((sum, r) => sum + (r.cycleLength || 0), 0) / allRecords.length)
        : 0,
      irregularCycles: allRecords.filter(r => r.cycleLength < 21 || r.cycleLength > 35).length
    };
    
    res.status(200).json({
      records,
      analytics,
      pagination: {
        total: records.length,
        page: 1,
        pages: 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};