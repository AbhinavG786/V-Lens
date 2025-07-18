import { Router } from "express";
import searchController from "../controllers/searchController";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router = Router();

router.get("/products",paginationMiddleware(10,50), searchController.searchProducts);

export default router;