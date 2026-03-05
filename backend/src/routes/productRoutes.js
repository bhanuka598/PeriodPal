const router = require("express").Router();
const { getProductById, getProducts, updateProduct, createProduct, deleteProduct } = require("../controllers/productController");

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
