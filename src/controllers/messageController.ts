import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';

const getOtherParticipant = (conversation: any, userId: string) => {
  return conversation.participants.find(
    (p: any) => p._id.toString() !== userId.toString()
  );
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'username firstName lastName avatar')
      .sort({ updatedAt: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const other = getOtherParticipant(conv, userId);
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        });

        return {
          id: conv._id,
          participant: other ? {
            id: other._id,
            name: `${other.firstName} ${other.lastName}`,
            username: other.username,
            avatar: other.avatar
          } : null,
          lastMessage: conv.lastMessage?.content || '',
          timestamp: conv.lastMessage?.createdAt || conv.updatedAt,
          unreadCount
        };
      })
    );

    res.json({ conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
};

export const createOrGetConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (participantId === userId.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 }
    }).populate('participants', 'username firstName lastName avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, participantId]
      });
      await conversation.populate('participants', 'username firstName lastName avatar');
    }

    const other = getOtherParticipant(conversation, userId);

    res.json({
      conversation: {
        id: conversation._id,
        participant: other ? {
          id: other._id,
          name: `${other.firstName} ${other.lastName}`,
          username: other.username,
          avatar: other.avatar
        } : null
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error creating conversation' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ conversation: id })
      .populate('sender', 'username firstName lastName avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit));

    await Message.updateMany(
      { conversation: id, sender: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.json({
      messages: messages.map((msg) => ({
        id: msg._id,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.createdAt,
        isOwn: (msg.sender as any)._id.toString() === userId.toString()
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    const message = await Message.create({
      conversation: id,
      sender: userId,
      content: content.trim(),
      readBy: [userId]
    });

    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      createdAt: new Date()
    };
    await conversation.save();

    await message.populate('sender', 'username firstName lastName avatar');

    const payload = {
      id: message._id,
      sender: message.sender,
      content: message.content,
      timestamp: message.createdAt,
      isOwn: true
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('message:new', {
        conversationId: id,
        message: payload
      });
    }

    res.status(201).json({
      message: payload
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id;
    const { search } = req.query;

    if (!search || (search as string).length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ]
    })
      .select('username firstName lastName avatar')
      .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
};
