const router = require("express").Router();
const {
  getAllOrders,
  checkout,
  updateContact,
  payOrder,
  getOrderById
} = require("../controllers/orderController");

router.get("/", getAllOrders);
router.post("/checkout", checkout);
router.patch("/:orderId/contact", updateContact);
router.post("/:orderId/pay", payOrder);
router.get("/:orderId", getOrderById);

module.exports = router;
