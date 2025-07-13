import product from "../controllers/productController"
import { Router } from "express";

const router= Router();

// router.route("/all").get(product.getAllProducts)
// router.route("/create").post(product.createProduct);
// router.route("/get/:id").get(product.getProductById);
// router.route("/update/:id").put(product.updateProduct);
// router.route("/delete/:id").delete(product.deleteProduct);
router.route("/random").get(product.getRandomProducts);
router.route("/trending").get(product.getTrendingProducts);


export default router;