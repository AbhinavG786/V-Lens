import { Router } from "express";
import searchController from "../controllers/searchController";

const router = Router();

router.get("/products", searchController.searchProducts);

export default router;