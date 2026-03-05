// backend/src/routes/inventoryRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/inventoryController");



// third-party feature
router.get("/nearby", controller.reverseGeocodeCenter);

// CRUD + business logic
router.post("/", controller.createInventory);
router.get("/", controller.getInventory);
router.get("/:id", controller.getInventoryById);
router.put("/:id", controller.updateInventory);
router.patch("/:id/adjust", controller.adjustStock);

// delete (TEMP: open for testing)
router.delete("/:id", controller.deleteInventory);

module.exports = router;
