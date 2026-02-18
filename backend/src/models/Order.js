const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    priceAtTime: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be ObjectId or string (for guest)

    items: [orderItemSchema],

    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    contactInfo: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    payment: {
      method: { type: String, default: "MOCK" },
      status: { type: String, enum: ["UNPAID", "PAID", "FAILED"], default: "UNPAID" },
      transactionId: { type: String, default: "" },
    },

    orderStatus: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
