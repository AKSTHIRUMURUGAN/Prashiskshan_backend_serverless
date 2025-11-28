import Notification from "../models/Notification.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";

export const getNotifications = async (req, res, next) => {
    try {
        const context = await resolveUserFromRequest(req);
        const notifications = await Notification.find({ userId: context.doc._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Calculate unread count
        const unreadCount = notifications.filter(n => !n.read).length;

        res.json(apiSuccess({ notifications, unreadCount }, "Notifications fetched successfully"));
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const context = await resolveUserFromRequest(req);
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: context.doc._id },
            { $set: { read: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            throw createHttpError(404, "Notification not found");
        }

        res.json(apiSuccess(notification, "Notification marked as read"));
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const context = await resolveUserFromRequest(req);

        await Notification.updateMany(
            { userId: context.doc._id, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        res.json(apiSuccess({}, "All notifications marked as read"));
    } catch (error) {
        next(error);
    }
};
