const router = require("express").Router();
const {
  getAllOrders,
  checkout,
  updateContact,
  payOrder,
  getOrderById,
  updateOrder,
  deleteOrder
} = require("../controllers/orderController");

router.get("/", getAllOrders);
router.post("/checkout", checkout);
router.patch("/:orderId/contact", updateContact);
router.post("/:orderId/pay", payOrder);

router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrder);
router.delete("/:orderId", deleteOrder);

module.exports = router;