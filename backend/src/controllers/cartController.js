const mongoose = require("mongoose");
const Cart = require("../models/Cart");
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

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId, status: "ACTIVE" }).populate("items.productId");
  if (!cart) cart = await Cart.create({ userId, items: [], status: "ACTIVE" });
  return cart;
}

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cart = await getOrCreateCart(userId);
  res.json({ success: true, cart });
});

// POST /api/cart/items { productId, qty }
exports.addToCart = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { productId, qty } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const quantity = Number(qty || 1);
  if (quantity < 1) return res.status(400).json({ success: false, message: "Qty must be >= 1" });
  if (product.stockQty < quantity) return res.status(400).json({ success: false, message: "Out of stock" });

  const cart = await Cart.findOne({ userId, status: "ACTIVE" });
  if (!cart) {
    const newCart = await Cart.create({
      userId,
      items: [{ productId, qty: quantity, priceAtTime: product.price }],
      status: "ACTIVE",
    });
    return res.status(201).json({ success: true, cart: newCart });
  }

  const existing = cart.items.find((i) => i.productId.toString() === productId);
  if (existing) {
    const newQty = existing.qty + quantity;
    if (product.stockQty < newQty) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }
    existing.qty = newQty;
  } else {
    cart.items.push({ productId, qty: quantity, priceAtTime: product.price });
  }

  await cart.save();
  const populated = await cart.populate("items.productId");
  res.json({ success: true, cart: populated });
});

// GET /api/carts/:id  (Get cart by ID)
exports.getCartById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart id" });
    }

    const cart = await Cart.findById(id).populate("items.productId");
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({ success: true, cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// PUT /api/carts/:id  (Update cart)
// You can update items array + status (safe fields only)
exports.updateCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart id" });
    }

    const allowedFields = ["items", "status"];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Optional: validate items manually (helps avoid bad payloads)
    if (updates.items) {
      if (!Array.isArray(updates.items)) {
        return res.status(400).json({ success: false, message: "items must be an array" });
      }

      for (const item of updates.items) {
        if (!item.productId || !mongoose.isValidObjectId(item.productId)) {
          return res.status(400).json({ success: false, message: "Invalid productId in items" });
        }
        if (item.qty === undefined || Number(item.qty) < 1) {
          return res.status(400).json({ success: false, message: "qty must be >= 1" });
        }
        if (item.priceAtTime === undefined || Number(item.priceAtTime) < 0) {
          return res.status(400).json({ success: false, message: "priceAtTime must be >= 0" });
        }
      }
    }

    const updated = await Cart.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("items.productId");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({ success: true, message: "Cart updated", cart: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// DELETE /api/carts/:id  (Delete cart)
exports.deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart id" });
    }

    const deleted = await Cart.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.status(200).json({ success: true, message: "Cart deleted", cart: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// GET /api/cart/summary
exports.getCartSummary = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cart = await getOrCreateCart(userId);

  const subtotal = cart.items.reduce((sum, i) => sum + i.qty * i.priceAtTime, 0);
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  res.json({ success: true, summary: { subtotal, shipping, tax, total } });
});
