import { Request, Response } from "express";
import dotenv from "dotenv";
import webPush from "web-push";
import { Notification } from "../models/notificationModel";
import { Subscription } from "../models/subscriptionModel";
import { User } from "../models/userModel";

dotenv.config();

webPush.setVapidDetails(
  `mailto:${process.env.EMAIL_ID}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

class NotificationController {
    
    saveSubscription = async (req: Request, res: Response) => {
    const { userId, subscription } = req.body;

    if (!userId || !subscription || !subscription.endpoint) {
        res.status(400).json({ message: "Missing userId or subscription details" });
        return;
    }

    try {
        const sub = await Subscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                userId,
                endpoint: subscription.endpoint,
                auth: subscription.keys.auth,
                p256dh: subscription.keys.p256dh,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: "Subscription saved successfully", sub });

        } 
        catch (error) {
            res.status(500).json({ message: "Error saving subscription", error });
            return;
        }
    };

    getUserSubscriptions = async (req: Request, res: Response) => {
        const { userId } = req.params;

        if (!userId){
            res.status(400).json({ message: "Missing userId" });
            return;
        }

        try {
            const subs = await Subscription.find({ userId });
            res.status(200).json(subs);
        } catch (error) {
            res.status(500).json({ message: "Error fetching subscriptions", error });
            return;
        }
    };


    createNotification = async (req: Request, res: Response) => {
        const { userId, title, message, eventType, channel } = req.body;

        if (!title || !message || !eventType || !userId) {
        res.status(400).json({ message: "Missing required fields" });
        return;
        }

        try {
        const notification = await Notification.create({
            userId,
            title,
            message,
            eventType,
            channel,
        });

        if (channel === "web") {
            const subscriptions = await Subscription.find({ userId });

            const payload = JSON.stringify({ title, message });

            for (const sub of subscriptions) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                auth: sub.auth,
                p256dh: sub.p256dh,
                },
            };

            try {
                await webPush.sendNotification(pushSubscription, payload);
            } catch (error: any) {
                if (error.statusCode === 410) {
                await Subscription.findOneAndDelete({ endpoint: sub.endpoint });
                }
            }
            }
        }

        res.status(201).json({ message: "Notification sent", notification });
        return;
        } catch (error) {
        res.status(500).json({ message: "Error sending notification", error });
        return;
        }
    };


    sendNotificationToAll = async (req: Request, res: Response) => {
    const { title, message, url, eventType } = req.body;

    if (!title || !message) {
        res.status(400).json({ error: "Title and message are required" });
        return;
    }

    try 
    {
        const users = await User.find({}, { _id: 1 });
        const userIds = users.map((u) => u._id);

        const notification = await Notification.create({ title, message, eventType });
        const payload = JSON.stringify({ title, message, url });

        await Promise.all(
            userIds.map(async (userId) => {
                const subscriptions = await Subscription.find({ userId });

                for (const sub of subscriptions) {
                    if (!sub.auth || !sub.p256dh) continue;

                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            auth: sub.auth,
                            p256dh: sub.p256dh,
                        },
                    };

                    try {
                        await webPush.sendNotification(pushSubscription, payload);
                    } 
                    catch (error: any) {
                        if (error.statusCode === 410) {
                            await Subscription.findOneAndDelete({ endpoint: sub.endpoint });
                        }
                    }
                }
            })
            );

            res.status(200).json({
                message: `Notification sent to ${userIds.length} user(s)`,
            });
        } catch (error) {
            res.status(500).json({ message: "Error sending bulk notifications", error });
        }
    };


    getAllNotifications = async (req: Request, res: Response) => {
        try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.status(200).json(notifications);
        return;
        } catch (error) {
        res.status(500).json({ message: "Error fetching notifications", error });
        return 
        }
    };

    getNotificationById = async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: "Missing ID param" });
            return;
        }

        try {
            const notification = await Notification.findById(id);
            if (!notification) {
                res.status(404).json({ message: "Notification not found" });
                return;
            }
            res.status(200).json(notification);
        } catch (error) {
            res.status(500).json({ message: "Error fetching notification", error });
            return;
        }
    };

    updateNotification = async (req: Request, res: Response) => {
        const { id } = req.params;
        const { isRead, title, message, eventType, channel } = req.body;

        if (!id) {
            res.status(400).json({ message: "Missing ID param" });
            return;
        }

        try {
        const updated = await Notification.findByIdAndUpdate(
            id,
            { isRead, title, message, eventType, channel },
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        res.status(200).json(updated);

        } catch (error) {
            res.status(500).json({ message: "Error updating notification", error });
            return;
        }
    };

    markNotificationAsRead = async (req: Request, res: Response) => {
        const { notificationId } = req.body;

        if (!notificationId) {
        return res.status(400).json({ message: "Missing notificationId" });
        }

        try {
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        return res.json({ success: true });
        } catch (error) {
        return res.status(500).json({ message: "Failed to mark as read", error });
        }
    };

    deleteNotification = async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id){
            res.status(400).json({ message: "Missing ID param" });
            return;
        }

        try {
        const deleted = await Notification.findByIdAndDelete(id);
        if (!deleted){
            res.status(404).json({ message: "Notification not found" });
            return;
        }

        res.status(200).json({ message: "Deleted successfully" });
        } catch (error) {
        res.status(500).json({ message: "Error deleting notification", error });
        return;
        }
    };
}

export default new NotificationController();