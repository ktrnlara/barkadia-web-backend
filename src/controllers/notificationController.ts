import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      notifications: notifications.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        relatedId: n.relatedId,
        isRead: n.isRead,
        createdAt: n.createdAt
      })),
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { isRead: true }
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    await Notification.findOneAndDelete({ _id: req.params.id, user: userId });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
