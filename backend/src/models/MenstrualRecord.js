const mongoose = require("mongoose");

const menstrualRecordSchema = new mongoose.Schema(
  {
    lastPeriodDate: {
      type: Date,
      required: true,
    },
    cycleLength: {
      type: Number,
      required: true,
    },
    flowIntensity: {
      type: String,
      enum: ["Light", "Medium", "Heavy"],
      default: "Medium",
    },
    symptoms: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenstrualRecord", menstrualRecordSchema);