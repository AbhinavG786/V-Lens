import review from "../controllers/reviewController";
import { Router } from "express";

const router = Router();

router.route("/create").post(review.createReview);
router.route("/list").get(review.getUserReviews);
router.route("/product/:productId").get(review.getProductReviews);
router.route("/update/:reviewId").patch(review.updateReview);
router.route("/remove/:reviewId").delete(review.deleteReview);

export default router;
