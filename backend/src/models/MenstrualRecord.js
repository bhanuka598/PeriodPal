const mongoose = require("mongoose");

const menstrualRecordSchema = new mongoose.Schema(
  {
    lastPeriodDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const inputDate = new Date(value);
          inputDate.setHours(0, 0, 0, 0);
          return inputDate >= today;
        },
        message: "Start date cannot be in the past",
      },
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