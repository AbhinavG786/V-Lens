import express from "express";
import Recommendation from "../controllers/recommendationController";

const router = express.Router();

router.get("/:userId", Recommendation.getRecommendationsForUser);

// New recommendation strategies
router.get("/:userId/trending", Recommendation.getTrendingRecommendations);
// Workaround for TypeScript/Express handler signature issue:
router.get("/:userId/collaborative", (Recommendation as any).getCollaborativeRecommendations);
router.get("/:userId/content", (Recommendation as any).getContentBasedRecommendations);

export default router;
