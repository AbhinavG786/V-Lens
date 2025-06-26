import express from "express";
import Recommendation from "../controllers/recommendationController";

const router = express.Router();

router.get("/:userId", Recommendation.getRecommendationsForUser);

export default router;
