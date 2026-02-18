const router = require("express").Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getCartSummary
} = require("../controllers/cartController");

router.get("/", getCart);
router.get("/summary", getCartSummary);
router.post("/items", addToCart);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);

module.exports = router;
