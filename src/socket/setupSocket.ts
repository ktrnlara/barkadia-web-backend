import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import Conversation from '../models/Conversation';
import User from '../models/User';
import { getJwtSecret } from '../utils/jwtSecret';

export function setupSocket(io: Server): void {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
      const user = await User.findById(decoded.userId).select('_id');
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('conversation:join', async (conversationId: string, callback?: (ok: boolean) => void) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        const isParticipant = conversation?.participants.some(
          (participant) => participant.toString() === userId
        );

        if (!isParticipant) {
          callback?.(false);
          return;
        }

        socket.join(`conversation:${conversationId}`);
        callback?.(true);
      } catch {
        callback?.(false);
      }
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });
  });
}

export function emitToConversationParticipants(
  io: Server,
  conversationId: string,
  participantIds: string[],
  senderId: string,
  payload: {
    id: unknown;
    sender: unknown;
    content: string;
    timestamp: Date;
  }
): void {
  participantIds.forEach((participantId) => {
    io.to(`user:${participantId}`).emit('message:new', {
      conversationId,
      message: {
        ...payload,
        isOwn: participantId === senderId,
      },
    });
  });
}
