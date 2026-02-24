const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// Helper to get userId from authenticated user or use a guest/default ID
function getUserId(req) {
  if (req.user?._id) {
    return req.user._id;
  }
  // Use guest ID from header, or default to "GUEST"
  return req.headers["x-guest-id"] || "GUEST";
}

// POST /api/orders/checkout
exports.checkout = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cart = await Cart.findOne({ userId, status: "ACTIVE" });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.qty * i.priceAtTime, 0);
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  const order = await Order.create({
    userId,
    items: cart.items,
    subtotal,
    shipping,
    tax,
    total,
    orderStatus: "PENDING",
    payment: { status: "UNPAID" }
  });

  res.status(201).json({ success: true, order });
});

// PATCH /api/orders/:orderId/contact
exports.updateContact = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const order = await Order.findOne({ _id: req.params.orderId, userId });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  order.contactInfo = req.body;
  await order.save();

  res.json({ success: true, order });
});

// POST /api/orders/:orderId/pay (MOCK)
exports.payOrder = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const order = await Order.findOne({ _id: req.params.orderId, userId });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (order.orderStatus === "PAID") return res.status(400).json({ success: false, message: "Already paid" });

  // Reduce stock
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.stockQty < item.qty) return res.status(400).json({ success: false, message: "Not enough stock" });

    product.stockQty -= item.qty;
    await product.save();
  }

  // Close cart
  await Cart.updateOne({ userId, status: "ACTIVE" }, { $set: { status: "CHECKED_OUT" } });

  order.orderStatus = "PAID";
  order.payment = { status: "PAID", method: "MOCK", transactionId: `TXN_${Date.now()}` };
  await order.save();

  res.json({ success: true, order });
});

// GET /api/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const orders = await Order.find({ userId }).populate("items.productId").sort({ createdAt: -1 });
  
  res.json({ success: true, orders, count: orders.length });
});

// GET /api/orders/:id  (Get order by ID)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params; // ✅ match route param

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



// DELETE /api/orders/:id  (Delete order)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const deleted = await Order.findByIdAndDelete(orderId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, message: "Order deleted", order: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


// PUT /api/orders/:orderId  (Update order)
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    // Map allowed fields to YOUR schema fields
    const updates = {};

    // orderStatus in schema (PENDING/PAID/FAILED)
    if (req.body.orderStatus !== undefined) updates.orderStatus = req.body.orderStatus;

    // payment is an object in schema: payment.status, payment.method, payment.transactionId
    if (req.body.payment !== undefined) updates.payment = req.body.payment;

    // contactInfo exists in schema
    if (req.body.contactInfo !== undefined) updates.contactInfo = req.body.contactInfo;

    // If you want to allow updating items (optional)
    if (req.body.items !== undefined) updates.items = req.body.items;

    const updated = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
      runValidators: true,
    }).populate("items.productId");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, message: "Order updated", order: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};