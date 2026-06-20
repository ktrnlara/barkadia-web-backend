import Notification from '../models/Notification';
import mongoose from 'mongoose';

export const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  type: 'like' | 'comment' | 'message' | 'system' | 'admin',
  title: string,
  message: string,
  relatedId?: string | mongoose.Types.ObjectId
) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedId
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};
