import product from "../controllers/productController"
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router= Router();

router.route("/all").get(paginationMiddleware(10,50),product.getAllProducts)
router.route("/get/:productId").get(product.getProductById);
router.route("/productType").get(paginationMiddleware(10,50),product.getAllProductsByType);
router.route("/priceRange").get(paginationMiddleware(10,50),product.getProductsByFinalPriceRange);
router.route("/random").get(product.getRandomProducts);
router.route("/trending").get(product.getTrendingProducts);

// router.route("/create").post(product.createProduct);
// router.route("/update/:id").put(product.updateProduct);
// router.route("/delete/:id").delete(product.deleteProduct);

export default router;