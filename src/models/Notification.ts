import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'like' | 'comment' | 'message' | 'system' | 'admin';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'message', 'system', 'admin'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
