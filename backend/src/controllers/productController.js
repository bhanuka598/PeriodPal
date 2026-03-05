const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/products?category=&q=&minPrice=&maxPrice=
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, q, minPrice, maxPrice } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: "i" };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, products });
});

// POST /api/products (simple create)
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, stockQty, imageUrl, description, priorityTag } = req.body;

  // Validate required fields
  if (!name || !category || price === undefined || stockQty === undefined) {
    return res.status(400).json({
      success: false,
      message: "Name, category, price, and stockQty are required"
    });
  }

  const product = await Product.create({
    name,
    category,
    price,
    stockQty,
    imageUrl,
    description,
    priorityTag
  });

  res.status(201).json({ success: true, product });
});

// GET /api/products/:id  (Get product by ID)
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// PUT /api/products/:id  (Update product)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    // Only allow fields you want to update (prevents unexpected updates)
    const allowedFields = [
      "name",
      "category",
      "description",
      "imageUrl",
      "price",
      "stockQty",
      "priorityTag",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product updated", product: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// DELETE /api/products/:id  (Delete product)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted", product: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};