import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    content: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date }
  }
}, {
  timestamps: true
});

ConversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
