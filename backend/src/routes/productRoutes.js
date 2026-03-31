const router = require("express").Router();
const { getProductById, getProducts, updateProduct, createProduct, deleteProduct } = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { multipartProductParser } = require("../middleware/uploadProductImage");

//public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

//protected routes (multipart optional image field: "image")
router.post(
  "/",
  protect,
  allowRoles("admin"),
  multipartProductParser,
  createProduct
);
router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  multipartProductParser,
  updateProduct
);
router.delete("/:id",protect, allowRoles("admin"), deleteProduct);

module.exports = router;
