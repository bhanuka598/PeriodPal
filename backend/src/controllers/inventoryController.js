const axios = require("axios");
const Inventory = require("../models/Inventory");

// POST /api/inventory
exports.createInventory = async (req, res) => {
  try {
    const { productType, totalStock, centerLocation } = req.body;

    if (!productType || !centerLocation) {
      return res.status(400).json({ message: "productType and centerLocation are required" });
    }

    const item = await Inventory.create({
      productType,
      totalStock: totalStock ?? 0,
      centerLocation,
      lastUpdated: new Date(),
    });

    return res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Inventory already exists for this productType and centerLocation",
      });
    }
    return res.status(400).json({ message: err.message });
  }
};

// GET /api/inventory
exports.getInventory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.productType) filter.productType = req.query.productType;
    if (req.query.centerLocation) filter.centerLocation = req.query.centerLocation;

    const items = await Inventory.find(filter).sort({ updatedAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/inventory/:id
exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory not found" });
    return res.json(item);
  } catch {
    return res.status(400).json({ message: "Invalid inventory id" });
  }
};

// PUT /api/inventory/:id
exports.updateInventory = async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Inventory not found" });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// DELETE /api/inventory/:id
exports.deleteInventory = async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Inventory not found" });
    return res.json({ message: "Inventory deleted successfully" });
  } catch {
    return res.status(400).json({ message: "Invalid inventory id" });
  }
};

// PATCH /api/inventory/:id/adjust
// Body: { change: 10 } or { change: -5 }
exports.adjustStock = async (req, res) => {
  try {
    const { change } = req.body;
    if (typeof change !== "number") {
      return res.status(400).json({ message: "change must be a number" });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory not found" });

    const newStock = item.totalStock + change;
    if (newStock < 0) return res.status(400).json({ message: "Insufficient stock" });

    item.totalStock = newStock;
    item.lastUpdated = new Date();
    await item.save();

    return res.json({ message: "Stock adjusted", item });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// ✅ Third-party API feature (OpenStreetMap Nominatim)
// GET /api/inventory/nearby?lat=6.9271&lng=79.8612
exports.reverseGeocodeCenter = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const url = "https://nominatim.openstreetmap.org/reverse";
    const response = await axios.get(url, {
      params: { format: "jsonv2", lat, lon: lng },
      headers: {
        // Nominatim recommends identifying your app
        "User-Agent": "PeriodPal-Inventory/1.0 (student-project)",
      },
      timeout: 10000,
    });

    const data = response.data;
    return res.json({
      input: { lat, lng },
      display_name: data.display_name,
      address: data.address,
    });
  } catch (err) {
    return res.status(502).json({ message: "Third-party API failed", error: err.message });
  }
};
