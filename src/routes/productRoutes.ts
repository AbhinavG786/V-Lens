import product from "../controllers/productController"
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router= Router();

router.route("/all").get(paginationMiddleware(10,50),product.getAllProducts)
// router.route("/create").post(product.createProduct);
// router.route("/get/:id").get(product.getProductById);
// router.route("/update/:id").put(product.updateProduct);
// router.route("/delete/:id").delete(product.deleteProduct);
router.route("/random").get(paginationMiddleware(10,50),product.getRandomProducts);
router.route("/trending").get(paginationMiddleware(10,50),product.getTrendingProducts);


export default router;