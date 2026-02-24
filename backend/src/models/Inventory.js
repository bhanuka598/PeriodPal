const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productType: { type: String, required: true, trim: true },
    totalStock: { type: Number, required: true, min: 0, default: 0 },
    centerLocation: { type: String, required: true, trim: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// prevent duplicate items for same productType+centerLocation
inventorySchema.index({ productType: 1, centerLocation: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
