const express = require("express");
const router = express.Router();

const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  sendReminderEmail,
  getAllRecordsAdmin,
} = require("../controllers/menstrualRecordController");

// Create
router.post("/", createRecord);

router.post("/:id/send-email",sendReminderEmail);

// Read all
router.get("/", getAllRecords);

// Read one
router.get("/:id", getRecordById);

// Update
router.put("/:id", updateRecord);

// Delete
router.delete("/:id", deleteRecord);

// Admin only - get all records with beneficiary info
router.get("/admin/all", getAllRecordsAdmin);

module.exports = router;