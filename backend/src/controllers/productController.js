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
