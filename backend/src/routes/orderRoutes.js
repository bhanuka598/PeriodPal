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
  verifyStripeSession,
  stripeWebhook,
  getAdminDonationStats,
  getMyDonationData,
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

// Must be before GET /:orderId or the param route catches this path.
router.get("/verify-stripe-session", verifyStripeSession);

// Donor dashboard (must be before GET /:orderId or "donor-summary" is treated as an order id)
router.get("/:orderId", protect, getMyDonationData);

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