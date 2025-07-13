import express from "express";
import { getTrendyProducts } from "../controllers/getProductController"; // adjust path as needed

const router = express.Router();

router.get("/products/trendy", getTrendyProducts);

export default router;
