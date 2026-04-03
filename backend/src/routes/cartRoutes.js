const router = require("express").Router();
const {
  getCart,
  addToCart,
  getCartSummary,
  getCartById,
  updateCart,
  deleteCart,
  mergeGuestCart,
} = require("../controllers/cartController");
const { optionalProtect, protect } = require("../middleware/authMiddleware");

router.use(optionalProtect);

router.get("/", getCart);
router.get("/summary", getCartSummary);
router.post("/merge", protect, mergeGuestCart);
router.post("/items", addToCart);
router.get("/:id", getCartById);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

module.exports = router;
