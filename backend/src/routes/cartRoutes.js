const router = require("express").Router();
const {
  getCart,
  addToCart,
  getCartSummary,
  getCartById,
  updateCart,
  deleteCart 
} = require("../controllers/cartController");

router.get("/", getCart);
router.get("/summary", getCartSummary);
router.post("/items", addToCart);
router.get("/:id", getCartById);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

module.exports = router;
