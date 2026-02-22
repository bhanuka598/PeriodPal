const express = require("express");
const router = express.Router();

const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  sendReminderEmail,
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

module.exports = router;