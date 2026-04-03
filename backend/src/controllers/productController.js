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

// POST /api/products — JSON or multipart (field "image" optional)
exports.createProduct = asyncHandler(async (req, res) => {
  const body =
    req.body != null && typeof req.body === "object" ? req.body : {};
  const { name, category, description, priorityTag, imageUrl } = body;
  const price = Number(body.price);
  const stockQty = Number(body.stockQty);

  // Validate required fields
  if (
    !name ||
    !String(name).trim() ||
    !category ||
    !String(category).trim() ||
    Number.isNaN(price) ||
    Number.isNaN(stockQty)
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, category, price, and stockQty are required",
    });
  }

  let finalImageUrl =
    typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : "";
  if (req.file) {
    finalImageUrl = `/uploads/products/${req.file.filename}`;
  }

  const product = await Product.create({
    name: String(name).trim(),
    category: String(category).trim(),
    price,
    stockQty,
    imageUrl: finalImageUrl,
    description: description != null ? String(description) : "",
    priorityTag: priorityTag || "MEDIUM",
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

// PUT /api/products/:id — JSON or multipart; new file replaces imageUrl
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const body =
    req.body != null && typeof req.body === "object" ? req.body : {};

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
    if (body[key] === undefined) continue;
    if (key === "price" || key === "stockQty") {
      const n = Number(body[key]);
      if (!Number.isNaN(n)) updates[key] = n;
    } else if (key === "name" || key === "category") {
      updates[key] = String(body[key]).trim();
    } else {
      updates[key] = body[key];
    }
  }

  if (req.file) {
    updates.imageUrl = `/uploads/products/${req.file.filename}`;
  }

    const updated = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

  return res.status(200).json({ success: true, message: "Product updated", product: updated });
});

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