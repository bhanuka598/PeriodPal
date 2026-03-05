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
    userId: { type: String, required: true, index: true }, // "GUEST" or user _id/email
    items: { type: [cartItemSchema], default: [] },
    status: { type: String, enum: ["ACTIVE", "CHECKED_OUT", "CANCELLED"], default: "ACTIVE" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
