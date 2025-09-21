import product from "../controllers/productController"
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import adminWarehouseAuth from "../middlewares/adminWarehouseAuth";
import upload from "../middlewares/upload";

const router= Router();

router.route("/all").get(paginationMiddleware(10,50),product.getAllProducts)
router.route("/random").get(paginationMiddleware(10,50),product.getRandomProducts);
router.route("/trending").get(paginationMiddleware(10,50),product.getTrendingProducts);
router.route("/get/:productId").get(product.getProductById);
router.route("/productType").get(paginationMiddleware(10,50),product.getAllProductsByType);
router.route("/all-3d-try-on").get(paginationMiddleware(10,50),product.getAllProductsWith3DTryOn);
router.route("/2d-try-on/:productId").post(adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single("file"),product.upload2dTryOnImage)
router.route("/3d-try-on/:productId").post(adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.array("files",2),product.upload3dTryOnFiles)

// router.route("/priceRange").get(paginationMiddleware(10,50),product.getProductsByFinalPriceRange);
// router.route("/create").post(product.createProduct);
// router.route("/update/:id").put(product.updateProduct);
// router.route("/delete/:id").delete(product.deleteProduct);

export default router;