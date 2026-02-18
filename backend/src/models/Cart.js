const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    priceAtTime: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be ObjectId or string (for guest)
    items: [cartItemSchema],
    status: { type: String, enum: ["ACTIVE", "CHECKED_OUT"], default: "ACTIVE" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
