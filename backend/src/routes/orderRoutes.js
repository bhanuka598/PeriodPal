const router = require("express").Router();

const {
  getAllOrders,
  checkout,
  updateContact,
  payOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
  createStripePayment,
  stripeWebhook,
  getAdminDonationStats,
} = require("../controllers/orderController");
const {
  optionalProtect,
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.use(optionalProtect);

// normal routes
router.get("/", getAllOrders);
router.get(
  "/admin/stats",
  protect,
  authorizeRoles("admin"),
  getAdminDonationStats
);
router.post("/checkout", checkout);
router.patch("/:orderId/contact", updateContact);
router.post("/:orderId/pay", payOrder);

// stripe payment session
router.post("/:orderId/create-payment", createStripePayment);

// IMPORTANT: webhook route (raw body MUST be applied in server.js, not here)
router.post("/webhook/stripe", stripeWebhook);

router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrder);
router.delete("/:orderId", deleteOrder);


module.exports = router;