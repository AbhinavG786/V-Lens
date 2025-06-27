import { Router } from "express";
import notification from "../controllers/notificationController";

const router = Router();

router.post("/create", notification.createNotification);
router.post("/sendAll",notification.sendNotificationToAll);
router.get("/all", notification.getAllNotifications);
router.get("/:id", notification.getNotificationById);
router.put("/:id", notification.updateNotification);
router.delete("/:id", notification.deleteNotification);
router.post("/saveSubscription", notification.saveSubscription);
router.get("/getSubscription/:userId", notification.getUserSubscriptions);

export default router;
