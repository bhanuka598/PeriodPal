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

// PATCH /api/cart/items/:itemId { qty }
exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { qty } = req.body;
  const quantity = Number(qty);

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: "Qty must be >= 1" });
  }

  const cart = await Cart.findOne({ userId, status: "ACTIVE" });
  if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: "Item not found" });

  const product = await Product.findById(item.productId);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  if (product.stockQty < quantity) return res.status(400).json({ success: false, message: "Not enough stock" });

  item.qty = quantity;
  await cart.save();

  const populated = await cart.populate("items.productId");
  res.json({ success: true, cart: populated });
});

// DELETE /api/cart/items/:itemId
exports.removeCartItem = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const cart = await Cart.findOne({ userId, status: "ACTIVE" });
  if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: "Item not found" });

  item.deleteOne();
  await cart.save();

  const populated = await cart.populate("items.productId");
  res.json({ success: true, cart: populated });
});

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
